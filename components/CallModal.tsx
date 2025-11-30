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
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // STUN and TURN servers for WebRTC
  // TURN servers are needed for NAT traversal when direct connection fails
  const iceServers = {
    iceServers: [
      // Google STUN servers
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      // Free TURN servers (may have rate limits)
      { 
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      { 
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      { 
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
    ],
    iceCandidatePoolSize: 10, // Pre-gather ICE candidates
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

  const pollForAnswer = useCallback(async (pc: RTCPeerConnection) => {
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
          console.log('[CALL] Answer received, setting remote description');
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          
          // Also fetch and add any pending ICE candidates
          try {
            const iceResponse = await fetch(
              `/api/calls/signal?fromUserId=${otherUserId}&toUserId=${currentUserId}&type=ice-candidates`
            );
            const iceData = await iceResponse.json();
            if (iceData.candidates && Array.isArray(iceData.candidates)) {
              console.log('[CALL] Adding', iceData.candidates.length, 'ICE candidates');
              for (const candidate of iceData.candidates) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                  console.warn('[CALL] Error adding ICE candidate:', err);
                }
              }
            }
          } catch (iceError) {
            console.warn('[CALL] Error fetching ICE candidates:', iceError);
          }
          
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
  }, [otherUserId, currentUserId, notifyCallEnd, onReject]);

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

      // Create peer connection with improved configuration
      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;
      
      // Set connection state handlers
      pc.onconnectionstatechange = () => {
        console.log('[CALL] Connection state:', pc.connectionState);
        if (pc.connectionState === 'failed') {
          console.error('[CALL] Connection failed - may need TURN server');
        }
      };
      
      pc.oniceconnectionstatechange = () => {
        console.log('[CALL] ICE connection state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') {
          console.error('[CALL] ICE connection failed - may need TURN server');
        } else if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          console.log('[CALL] ✅ ICE connection established! Audio should work now.');
          // When ICE is connected, ensure audio is playing
          setTimeout(() => {
            if (remoteAudioRef.current && remoteAudioRef.current.paused) {
              remoteAudioRef.current.play().catch(err => {
                console.error('[CALL] Error playing after ICE connection:', err);
              });
            }
          }, 100);
        }
      };
      
      pc.onicegatheringstatechange = () => {
        console.log('[CALL] ICE gathering state:', pc.iceGatheringState);
      };

      // Add local stream tracks and ensure they're not muted
      stream.getTracks().forEach((track) => {
        console.log('[CALL] Adding local track:', track.kind, 'enabled:', track.enabled, 'muted:', track.muted);
        // Ensure track is enabled
        track.enabled = true;
        const sender = pc.addTrack(track, stream);
        console.log('[CALL] Track sender created:', sender.track?.id, 'track enabled:', sender.track?.enabled, 'track muted:', sender.track?.muted);
        
        // Monitor track state changes
        track.onmute = () => {
          console.warn('[CALL] Local track was muted!', track.kind, track.id);
        };
        track.onunmute = () => {
          console.log('[CALL] Local track was unmuted', track.kind, track.id);
        };
      });

      // Handle remote stream - use the stream from the event directly
      pc.ontrack = (event) => {
        console.log('[CALL] Remote track received:', event.track.kind, event.track.enabled, event.streams);
        console.log('[CALL] Event streams count:', event.streams.length);
        
        // Use the stream from the event - it already contains the track
        const remoteStream = event.streams[0];
        console.log('[CALL] Using stream from event, tracks:', remoteStream.getTracks().map(t => ({ 
          id: t.id, 
          kind: t.kind, 
          enabled: t.enabled, 
          muted: t.muted 
        })));
        
        // Ensure track is enabled and log track details
        event.track.enabled = true;
        const trackDetails = {
          id: event.track.id,
          label: event.track.label,
          readyState: event.track.readyState,
          muted: event.track.muted,
          settings: event.track.getSettings ? event.track.getSettings() : 'N/A'
        };
        console.log('[CALL] Track details:', trackDetails);
        
        // Monitor track state changes
        event.track.onmute = () => {
          console.warn('[CALL] Remote track was muted!', event.track.kind, event.track.id);
        };
        event.track.onunmute = () => {
          console.log('[CALL] Remote track was unmuted', event.track.kind, event.track.id);
          // When track is unmuted, try to play audio again
          if (event.track.kind === 'audio' && remoteAudioRef.current && peerConnectionRef.current) {
            const pc = peerConnectionRef.current;
            console.log('[CALL] Track unmuted, ICE state:', pc.iceConnectionState, 'Connection state:', pc.connectionState);
            setTimeout(() => {
              if (remoteAudioRef.current && !remoteAudioRef.current.paused) {
                remoteAudioRef.current.play().catch(err => {
                  console.error('[CALL] Error playing after unmute:', err);
                });
              }
            }, 100);
          }
        };
        
        // Warn if track is muted - this is the likely cause of no sound
        if (event.track.muted) {
          console.warn('[CALL] ⚠️ REMOTE TRACK IS MUTED! This is why there is no sound.');
          console.warn('[CALL] The remote user may have muted their microphone, or there is an issue with the track transmission.');
          console.warn('[CALL] This might be a WebRTC bug - the track is marked as muted even though the sender did not mute it.');
        }
        
        // Set up audio element when we have audio track
        if (event.track.kind === 'audio' && remoteAudioRef.current && remoteStream) {
          console.log('[CALL] Setting up audio element with combined stream');
          const audioTracks = remoteStream.getAudioTracks();
          console.log('[CALL] Stream audio tracks:', audioTracks.map(t => ({ 
            id: t.id, 
            enabled: t.enabled, 
            readyState: t.readyState,
            muted: t.muted,
            label: t.label
          })));
          
          // Only set srcObject if it's different to avoid interrupting playback
          if (remoteAudioRef.current.srcObject !== remoteStream) {
            remoteAudioRef.current.srcObject = remoteStream;
          }
          remoteAudioRef.current.muted = false;
          remoteAudioRef.current.volume = 1.0;
          
          // Check if audio element actually has audio tracks
          if (audioTracks.length === 0) {
            console.warn('[CALL] No audio tracks in stream!');
          }
          
          // Wait for ICE connection before trying to play
          const tryPlay = () => {
            if (remoteAudioRef.current && peerConnectionRef.current) {
              const pc = peerConnectionRef.current;
              const tracks = remoteStream?.getAudioTracks() || [];
              const iceState = pc.iceConnectionState;
              const connState = pc.connectionState;
              
              console.log('[CALL] Attempting to play audio, muted:', remoteAudioRef.current.muted, 'volume:', remoteAudioRef.current.volume, 'readyState:', remoteAudioRef.current.readyState, 'tracks:', tracks.length, 'track muted:', tracks[0]?.muted, 'ICE:', iceState, 'Connection:', connState);
              
              // Only try to play if ICE is connected or connecting
              if (iceState === 'connected' || iceState === 'completed' || iceState === 'checking') {
                remoteAudioRef.current.play().then(() => {
                  console.log('[CALL] Audio playing successfully, paused:', remoteAudioRef.current?.paused);
                  // Double check that it's actually playing
                  setTimeout(() => {
                    if (remoteAudioRef.current) {
                      const currentTracks = (remoteAudioRef.current.srcObject as MediaStream)?.getAudioTracks() || [];
                      console.log('[CALL] Audio state after play - paused:', remoteAudioRef.current.paused, 'ended:', remoteAudioRef.current.ended, 'currentTime:', remoteAudioRef.current.currentTime, 'track muted:', currentTracks[0]?.muted, 'ICE:', pc.iceConnectionState);
                    }
                  }, 500);
                }).catch(err => {
                  console.error('[CALL] Error playing remote audio:', err);
                });
              } else {
                console.log('[CALL] Waiting for ICE connection before playing (current state:', iceState, ')');
              }
            }
          };
          
          // Try to play immediately and after delays
          tryPlay();
          setTimeout(tryPlay, 100);
          setTimeout(tryPlay, 500);
          setTimeout(tryPlay, 1000);
          setTimeout(tryPlay, 2000);
        }
        
        // Set up video element when we have video track
        if (event.track.kind === 'video' && remoteVideoRef.current && remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.muted = false;
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
          console.log('[CALL] ICE candidate:', event.candidate.type, event.candidate.candidate.substring(0, 50));
          try {
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
          } catch (error) {
            console.error('[CALL] Error sending ICE candidate:', error);
          }
        } else {
          console.log('[CALL] ICE candidate gathering complete');
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
  }, [isVideoEnabled, currentUserId, otherUserId, onReject, pollForAnswer, notifyCallEnd]);

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

      // Create peer connection with improved configuration
      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;
      
      // Set connection state handlers
      pc.onconnectionstatechange = () => {
        console.log('[CALL] Connection state:', pc.connectionState);
        if (pc.connectionState === 'failed') {
          console.error('[CALL] Connection failed - may need TURN server');
        }
      };
      
      pc.oniceconnectionstatechange = () => {
        console.log('[CALL] ICE connection state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') {
          console.error('[CALL] ICE connection failed - may need TURN server');
        } else if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          console.log('[CALL] ✅ ICE connection established! Audio should work now.');
          // When ICE is connected, ensure audio is playing
          setTimeout(() => {
            if (remoteAudioRef.current && remoteAudioRef.current.paused) {
              remoteAudioRef.current.play().catch(err => {
                console.error('[CALL] Error playing after ICE connection:', err);
              });
            }
          }, 100);
        }
      };
      
      pc.onicegatheringstatechange = () => {
        console.log('[CALL] ICE gathering state:', pc.iceGatheringState);
      };

      // Add local stream tracks and ensure they're not muted
      stream.getTracks().forEach((track) => {
        console.log('[CALL] Adding local track:', track.kind, 'enabled:', track.enabled, 'muted:', track.muted);
        // Ensure track is enabled
        track.enabled = true;
        const sender = pc.addTrack(track, stream);
        console.log('[CALL] Track sender created:', sender.track?.id, 'track enabled:', sender.track?.enabled, 'track muted:', sender.track?.muted);
        
        // Monitor track state changes
        track.onmute = () => {
          console.warn('[CALL] Local track was muted!', track.kind, track.id);
        };
        track.onunmute = () => {
          console.log('[CALL] Local track was unmuted', track.kind, track.id);
        };
      });

      // Handle remote stream - use the stream from the event directly
      pc.ontrack = (event) => {
        console.log('[CALL] Remote track received:', event.track.kind, event.track.enabled, event.streams);
        console.log('[CALL] Event streams count:', event.streams.length);
        
        // Use the stream from the event - it already contains the track
        const remoteStream = event.streams[0];
        console.log('[CALL] Using stream from event, tracks:', remoteStream.getTracks().map(t => ({ 
          id: t.id, 
          kind: t.kind, 
          enabled: t.enabled, 
          muted: t.muted 
        })));
        
        // Ensure track is enabled and log track details
        event.track.enabled = true;
        const trackDetails = {
          id: event.track.id,
          label: event.track.label,
          readyState: event.track.readyState,
          muted: event.track.muted,
          settings: event.track.getSettings ? event.track.getSettings() : 'N/A'
        };
        console.log('[CALL] Track details:', trackDetails);
        
        // Monitor track state changes
        event.track.onmute = () => {
          console.warn('[CALL] Remote track was muted!', event.track.kind, event.track.id);
        };
        event.track.onunmute = () => {
          console.log('[CALL] Remote track was unmuted', event.track.kind, event.track.id);
          // When track is unmuted, try to play audio again
          if (event.track.kind === 'audio' && remoteAudioRef.current && peerConnectionRef.current) {
            const pc = peerConnectionRef.current;
            console.log('[CALL] Track unmuted, ICE state:', pc.iceConnectionState, 'Connection state:', pc.connectionState);
            setTimeout(() => {
              if (remoteAudioRef.current && !remoteAudioRef.current.paused) {
                remoteAudioRef.current.play().catch(err => {
                  console.error('[CALL] Error playing after unmute:', err);
                });
              }
            }, 100);
          }
        };
        
        // Warn if track is muted - this is the likely cause of no sound
        if (event.track.muted) {
          console.warn('[CALL] ⚠️ REMOTE TRACK IS MUTED! This is why there is no sound.');
          console.warn('[CALL] The remote user may have muted their microphone, or there is an issue with the track transmission.');
          console.warn('[CALL] This might be a WebRTC bug - the track is marked as muted even though the sender did not mute it.');
        }
        
        // Set up audio element when we have audio track
        if (event.track.kind === 'audio' && remoteAudioRef.current && remoteStream) {
          console.log('[CALL] Setting up audio element with combined stream');
          const audioTracks = remoteStream.getAudioTracks();
          console.log('[CALL] Stream audio tracks:', audioTracks.map(t => ({ 
            id: t.id, 
            enabled: t.enabled, 
            readyState: t.readyState,
            muted: t.muted,
            label: t.label
          })));
          
          // Only set srcObject if it's different to avoid interrupting playback
          if (remoteAudioRef.current.srcObject !== remoteStream) {
            remoteAudioRef.current.srcObject = remoteStream;
          }
          remoteAudioRef.current.muted = false;
          remoteAudioRef.current.volume = 1.0;
          
          // Check if audio element actually has audio tracks
          if (audioTracks.length === 0) {
            console.warn('[CALL] No audio tracks in stream!');
          }
          
          // Wait for ICE connection before trying to play
          const tryPlay = () => {
            if (remoteAudioRef.current && peerConnectionRef.current) {
              const pc = peerConnectionRef.current;
              const tracks = remoteStream?.getAudioTracks() || [];
              const iceState = pc.iceConnectionState;
              const connState = pc.connectionState;
              
              console.log('[CALL] Attempting to play audio, muted:', remoteAudioRef.current.muted, 'volume:', remoteAudioRef.current.volume, 'readyState:', remoteAudioRef.current.readyState, 'tracks:', tracks.length, 'track muted:', tracks[0]?.muted, 'ICE:', iceState, 'Connection:', connState);
              
              // Only try to play if ICE is connected or connecting
              if (iceState === 'connected' || iceState === 'completed' || iceState === 'checking') {
                remoteAudioRef.current.play().then(() => {
                  console.log('[CALL] Audio playing successfully, paused:', remoteAudioRef.current?.paused);
                  // Double check that it's actually playing
                  setTimeout(() => {
                    if (remoteAudioRef.current) {
                      const currentTracks = (remoteAudioRef.current.srcObject as MediaStream)?.getAudioTracks() || [];
                      console.log('[CALL] Audio state after play - paused:', remoteAudioRef.current.paused, 'ended:', remoteAudioRef.current.ended, 'currentTime:', remoteAudioRef.current.currentTime, 'track muted:', currentTracks[0]?.muted, 'ICE:', pc.iceConnectionState);
                    }
                  }, 500);
                }).catch(err => {
                  console.error('[CALL] Error playing remote audio:', err);
                });
              } else {
                console.log('[CALL] Waiting for ICE connection before playing (current state:', iceState, ')');
              }
            }
          };
          
          // Try to play immediately and after delays
          tryPlay();
          setTimeout(tryPlay, 100);
          setTimeout(tryPlay, 500);
          setTimeout(tryPlay, 1000);
          setTimeout(tryPlay, 2000);
        }
        
        // Set up video element when we have video track
        if (event.track.kind === 'video' && remoteVideoRef.current && remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.muted = false;
        }
        
        setCallStatus('connected');
      };

      // Get offer from API
      const response = await fetch(
        `/api/calls/signal?fromUserId=${otherUserId}&toUserId=${currentUserId}&type=offer`
      );
      const data = await response.json();

      if (data.offer) {
        console.log('[CALL] Offer received, setting remote description');
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        // Also fetch and add any pending ICE candidates
        try {
          const iceResponse = await fetch(
            `/api/calls/signal?fromUserId=${otherUserId}&toUserId=${currentUserId}&type=ice-candidates`
          );
          const iceData = await iceResponse.json();
          if (iceData.candidates && Array.isArray(iceData.candidates)) {
            console.log('[CALL] Adding', iceData.candidates.length, 'ICE candidates');
            for (const candidate of iceData.candidates) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (err) {
                console.warn('[CALL] Error adding ICE candidate:', err);
              }
            }
          }
        } catch (iceError) {
          console.warn('[CALL] Error fetching ICE candidates:', iceError);
        }

        console.log('[CALL] Creating answer...');
        const answer = await pc.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: isVideoEnabled,
        });
        await pc.setLocalDescription(answer);
        console.log('[CALL] Answer created, SDP:', answer.sdp?.substring(0, 200));

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
          console.log('[CALL] ICE candidate:', event.candidate.type, event.candidate.candidate.substring(0, 50));
          try {
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
          } catch (error) {
            console.error('[CALL] Error sending ICE candidate:', error);
          }
        } else {
          console.log('[CALL] ICE candidate gathering complete');
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
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
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
        {/* Hidden audio element for remote audio */}
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          muted={false}
          style={{ position: 'absolute', visibility: 'hidden', width: 0, height: 0 }}
          onLoadedMetadata={() => {
            console.log('[CALL] Audio metadata loaded');
            if (remoteAudioRef.current) {
              remoteAudioRef.current.muted = false;
              remoteAudioRef.current.volume = 1.0;
              console.log('[CALL] Audio element state - muted:', remoteAudioRef.current.muted, 'volume:', remoteAudioRef.current.volume);
              remoteAudioRef.current.play().then(() => {
                console.log('[CALL] Audio started playing from onLoadedMetadata');
              }).catch(err => {
                console.error('[CALL] Error playing audio on load:', err);
              });
            }
          }}
          onCanPlay={() => {
            console.log('[CALL] Audio can play');
            if (remoteAudioRef.current) {
              remoteAudioRef.current.play().catch(err => {
                console.error('[CALL] Error playing audio on canPlay:', err);
              });
            }
          }}
          onPlay={() => {
            console.log('[CALL] Audio is playing');
          }}
          onPause={() => {
            console.log('[CALL] Audio paused');
          }}
          onError={(e) => {
            console.error('[CALL] Audio element error:', e);
          }}
        />
        {/* Remote Video */}
        <div className="flex-1 relative bg-neutral-900 rounded-t-2xl overflow-hidden">
          {remoteVideoRef.current?.srcObject ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false}
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

