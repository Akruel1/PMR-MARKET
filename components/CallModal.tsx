'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from 'lucide-react';
import Image from 'next/image';

interface CallModalProps {
  isOpen: boolean;
  isIncoming: boolean;
  callerName?: string;
  callerImage?: string;
  onAccept?: () => void;
  onReject: () => void;
  onEnd: () => void;
  otherUserId: string;
  currentUserId: string;
}

export default function CallModal({
  isOpen,
  isIncoming,
  callerName,
  callerImage,
  onAccept,
  onReject,
  onEnd,
  otherUserId,
  currentUserId,
}: CallModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const callEndedRef = useRef(false); // Track if call end was already notified
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // STUN servers for WebRTC
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  const notifyCallEnd = useCallback(async (type: 'end-call' | 'reject' = 'end-call') => {
    if (callEndedRef.current) {
      console.log('[CALL] Call end already notified, skipping');
      return;
    }
    
    try {
      await fetch('/api/calls/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type,
          fromUserId: currentUserId,
          toUserId: otherUserId,
        }),
      });
      callEndedRef.current = true;
      console.log(`[CALL] Notified server about ${type}`);
    } catch (error) {
      console.error(`[CALL] Error notifying ${type}:`, error);
    }
  }, [currentUserId, otherUserId]);

  const startCall = useCallback(async () => {
    try {
      console.log('[CALL] Starting call...');
      
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('[CALL] MediaDevices not supported');
        throw new Error('MediaDevicesNotSupported');
      }

      // Check if we're on HTTPS or localhost (required for WebRTC)
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      console.log('[CALL] Protocol:', window.location.protocol, 'Secure:', isSecure);
      if (!isSecure) {
        console.error('[CALL] HTTPS required');
        throw new Error('HTTPSRequired');
      }

      // Check permissions first (if available)
      try {
        if (navigator.permissions) {
          const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          console.log('[CALL] Microphone permission:', micPermission.state);
          console.log('[CALL] Camera permission:', cameraPermission.state);
          
          if (micPermission.state === 'denied' || cameraPermission.state === 'denied') {
            throw new Error('PermissionDeniedError');
          }
        }
      } catch (permError) {
        // Permissions API might not be available, continue anyway
        console.log('[CALL] Permissions API not available, continuing...');
      }

      console.log('[CALL] Requesting user media...');
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideoEnabled,
      });
      console.log('[CALL] User media obtained successfully');
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;

      // Add local stream tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('[CALL] Remote track received:', event.track.kind, event.track.enabled);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          // Ensure audio is not muted
          remoteVideoRef.current.muted = false;
          // Ensure video element plays audio
          if (event.track.kind === 'audio') {
            event.track.enabled = true;
          }
        }
        setCallStatus('connected');
      };

      // Create offer
      console.log('[CALL] Creating offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('[CALL] Offer created, sending to server...');

      // Send offer to other user via API
      const response = await fetch('/api/calls/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'offer',
          offer: offer,
          fromUserId: currentUserId,
          toUserId: otherUserId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send offer: ${response.status}`);
      }
      console.log('[CALL] Offer sent successfully');

      // Handle ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await fetch('/api/calls/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'ice-candidate',
              candidate: event.candidate,
              fromUserId: currentUserId,
              toUserId: otherUserId,
            }),
          });
        }
      };

      // Poll for answer
      pollForAnswer(pc);
    } catch (error: any) {
      console.error('[CALL] Error starting call:', error);
      console.error('[CALL] Error name:', error.name);
      console.error('[CALL] Error message:', error.message);
      console.error('[CALL] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      let errorMsg = 'Не удалось начать звонок.';
      
      if (error.message === 'MediaDevicesNotSupported') {
        errorMsg = 'Ваш браузер не поддерживает доступ к камере и микрофону. Пожалуйста, используйте современный браузер (Chrome, Firefox, Safari, Edge).';
      } else if (error.message === 'HTTPSRequired') {
        errorMsg = 'Для работы звонков требуется безопасное соединение (HTTPS). Пожалуйста, используйте HTTPS для доступа к сайту.';
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError' || error.message === 'PermissionDeniedError' || error.message?.includes('Permissions policy violation')) {
        errorMsg = 'Доступ к камере и микрофону запрещён политикой безопасности. Пожалуйста, разрешите доступ в настройках браузера (иконка замка в адресной строке) или обратитесь к системному администратору.';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'Камера или микрофон не найдены. Убедитесь, что устройства подключены.';
      } else if (error.name === 'NotReadableError') {
        errorMsg = 'Камера или микрофон заняты другим приложением. Закройте другие приложения, использующие эти устройства.';
      } else if (error.name === 'OverconstrainedError') {
        errorMsg = 'Запрошенные параметры камеры или микрофона не поддерживаются.';
      } else {
        errorMsg = `Не удалось начать звонок. ${error.message || 'Убедитесь, что разрешён доступ к микрофону и камере.'}`;
      }
      
      console.log('[CALL] Setting error message:', errorMsg);
      setErrorMessage(errorMsg);
      setCallStatus('ended');
      
      // Notify server that call failed
      try {
        await fetch('/api/calls/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'reject',
            fromUserId: currentUserId,
            toUserId: otherUserId,
          }),
        });
      } catch (err) {
        console.error('[CALL] Error notifying call rejection:', err);
      }
    }
  }, [isVideoEnabled, currentUserId, otherUserId, onReject]);

  useEffect(() => {
    if (!isOpen) {
      // If modal is closed and call was not connected, notify server
      if (callStatus !== 'connected' && callStatus !== 'ended' && !callEndedRef.current) {
        notifyCallEnd('reject').catch(err => console.error('[CALL] Error notifying on close:', err));
      }
      cleanup();
      callEndedRef.current = false; // Reset when modal closes
      return;
    }

    // Reset error when modal opens
    setErrorMessage(null);
    callEndedRef.current = false; // Reset when modal opens

    if (!isIncoming && callStatus === 'connecting') {
      // Initiating call
      startCall();
    }

    return () => {
      if (!isOpen) {
        cleanup();
      }
    };
  }, [isOpen, isIncoming, callStatus, startCall, notifyCallEnd]);

  const pollForAnswer = async (pc: RTCPeerConnection) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        alert('Звонок не был принят');
        await notifyCallEnd('reject');
        onReject();
        return;
      }

      try {
        const response = await fetch(
          `/api/calls/signal?fromUserId=${otherUserId}&toUserId=${currentUserId}&type=answer`
        );
        const data = await response.json();

        if (data.answer) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallStatus('connected');
        } else {
          attempts++;
          setTimeout(poll, 1000);
        }
      } catch (error) {
        attempts++;
        setTimeout(poll, 1000);
      }
    };

    poll();
  };

  const handleAccept = async () => {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevicesNotSupported');
      }

      // Check if we're on HTTPS or localhost (required for WebRTC)
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isSecure) {
        throw new Error('HTTPSRequired');
      }

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideoEnabled,
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;

      // Add local stream tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('[CALL] Remote track received:', event.track.kind, event.track.enabled);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          // Ensure audio is not muted
          remoteVideoRef.current.muted = false;
          // Ensure video element plays audio
          if (event.track.kind === 'audio') {
            event.track.enabled = true;
          }
        }
        setCallStatus('connected');
      };

      // Get offer from API
      const response = await fetch(
        `/api/calls/signal?fromUserId=${otherUserId}&toUserId=${currentUserId}&type=offer`
      );
      const data = await response.json();

      if (data.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

        // Create answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Send answer
        await fetch('/api/calls/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'answer',
            answer: answer,
            fromUserId: currentUserId,
            toUserId: otherUserId,
          }),
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await fetch('/api/calls/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'ice-candidate',
              candidate: event.candidate,
              fromUserId: currentUserId,
              toUserId: otherUserId,
            }),
          });
        }
      };

      if (onAccept) {
        onAccept();
      }
    } catch (error: any) {
      console.error('Error accepting call:', error);
      let errorMsg = 'Не удалось принять звонок.';
      
      if (error.message === 'MediaDevicesNotSupported') {
        errorMsg = 'Ваш браузер не поддерживает доступ к камере и микрофону. Пожалуйста, используйте современный браузер (Chrome, Firefox, Safari, Edge).';
      } else if (error.message === 'HTTPSRequired') {
        errorMsg = 'Для работы звонков требуется безопасное соединение (HTTPS). Пожалуйста, используйте HTTPS для доступа к сайту.';
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMsg = 'Доступ к камере и микрофону запрещён. Пожалуйста, разрешите доступ в настройках браузера или обратитесь к системному администратору.';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'Камера или микрофон не найдены. Убедитесь, что устройства подключены.';
      } else if (error.name === 'NotReadableError') {
        errorMsg = 'Камера или микрофон заняты другим приложением. Закройте другие приложения, использующие эти устройства.';
      } else if (error.name === 'OverconstrainedError') {
        errorMsg = 'Запрошенные параметры камеры или микрофона не поддерживаются.';
      } else {
        errorMsg = 'Не удалось принять звонок. Убедитесь, что разрешён доступ к микрофону и камере.';
      }
      
      setErrorMessage(errorMsg);
      setCallStatus('ended');
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    } else if (!isVideoEnabled) {
      // Start video if not already started
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: isMuted ? false : true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsVideoEnabled(true);
      } catch (error) {
        console.error('Error enabling video:', error);
      }
    }
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setIsMuted(false);
    setIsVideoEnabled(false);
    setCallStatus('connecting');
    setErrorMessage(null);
  };

  const handleEnd = async () => {
    cleanup();
    await notifyCallEnd('end-call');
    onEnd();
  };

  const handleReject = async () => {
    cleanup();
    await notifyCallEnd('reject');
    onReject();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="relative w-full h-full max-w-4xl max-h-screen flex flex-col">
        {/* Remote Video */}
        <div className="flex-1 relative bg-neutral-900 rounded-t-2xl overflow-hidden">
          {remoteVideoRef.current?.srcObject ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false}
              volume={1.0}
              className="w-full h-full object-cover"
              onLoadedMetadata={() => {
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.muted = false;
                  remoteVideoRef.current.volume = 1.0;
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {callerImage ? (
                <Image
                  src={callerImage}
                  alt={callerName || 'User'}
                  width={200}
                  height={200}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-48 h-48 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <span className="text-6xl text-primary-300">
                    {(callerName || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Local Video (Picture-in-Picture) */}
          {isVideoEnabled && localVideoRef.current?.srcObject && (
            <div className="absolute top-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-white/50">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
              <div className="text-center text-white max-w-md mx-4 p-6 bg-[#0b101c] rounded-2xl border-2 border-red-500/50 shadow-2xl">
                <p className="text-xl font-semibold mb-3 text-red-400">Ошибка доступа</p>
                <p className="text-sm text-neutral-300 mb-6 leading-relaxed">{errorMessage}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={async () => {
                      setErrorMessage(null);
                      setCallStatus('connecting');
                      await notifyCallEnd('reject');
                      onReject();
                    }}
                    className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-medium"
                  >
                    Закрыть
                  </button>
                  {errorMessage.includes('запрещён') && (
                    <button
                      onClick={async () => {
                        setErrorMessage(null);
                        setCallStatus('connecting');
                        // Try to request permissions again
                        try {
                          await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                          // If successful, try starting call again
                          startCall();
                        } catch (e) {
                          setErrorMessage('Не удалось получить доступ. Пожалуйста, разрешите доступ в настройках браузера.');
                          setCallStatus('ended');
                        }
                      }}
                      className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition font-medium"
                    >
                      Попробовать снова
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Call Status */}
          {callStatus === 'connecting' && !errorMessage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center text-white">
                <p className="text-xl mb-2">
                  {isIncoming ? 'Входящий звонок...' : 'Соединение...'}
                </p>
                <p className="text-neutral-400">{callerName || 'Пользователь'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-[#0b101c] border-t border-neutral-900 p-6">
          {isIncoming && callStatus === 'connecting' ? (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleAccept}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition"
              >
                <Phone className="h-8 w-8 text-white" />
              </button>
              <button
                onClick={handleReject}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition"
              >
                <PhoneOff className="h-8 w-8 text-white" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
                  isMuted
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-neutral-800 hover:bg-neutral-700'
                }`}
              >
                {isMuted ? (
                  <MicOff className="h-6 w-6 text-white" />
                ) : (
                  <Mic className="h-6 w-6 text-white" />
                )}
              </button>
              <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
                  isVideoEnabled
                    ? 'bg-neutral-800 hover:bg-neutral-700'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isVideoEnabled ? (
                  <Video className="h-6 w-6 text-white" />
                ) : (
                  <VideoOff className="h-6 w-6 text-white" />
                )}
              </button>
              <button
                onClick={handleEnd}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition"
              >
                <PhoneOff className="h-8 w-8 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

