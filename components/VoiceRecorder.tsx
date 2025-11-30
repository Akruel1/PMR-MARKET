'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface VoiceRecorderProps {
  onRecordingComplete: (audioUrl: string, audioBlob: Blob) => void;
  onCancel?: () => void;
}

export default function VoiceRecorder({ onRecordingComplete, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Ваш браузер не поддерживает запись аудио. Используйте современный браузер.');
        return;
      }

      // Check if we're on HTTPS or localhost
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isSecure) {
        toast.error('Для записи требуется безопасное соединение (HTTPS).');
        return;
      }

      console.log('[VOICE] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[VOICE] Microphone access granted');
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error: any) {
      console.error('[VOICE] Error starting recording:', error);
      let errorMsg = 'Не удалось начать запись.';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMsg = 'Доступ к микрофону запрещён. Пожалуйста, разрешите доступ в настройках браузера (иконка замка в адресной строке) или обратитесь к системному администратору.';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'Микрофон не найден. Убедитесь, что устройство подключено.';
      } else if (error.name === 'NotReadableError') {
        errorMsg = 'Микрофон занят другим приложением. Закройте другие приложения, использующие микрофон.';
      } else if (error.message?.includes('Permissions policy violation')) {
        errorMsg = 'Доступ к микрофону запрещён политикой безопасности. Обратитесь к системному администратору.';
      }
      
      toast.error(errorMsg);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const playPreview = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice-message.webm');

      const response = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload audio');
      }

      const data = await response.json();
      onRecordingComplete(data.url, audioBlob);
      
      // Cleanup
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(null);
      setAudioBlob(null);
      setRecordingTime(0);
    } catch (error: any) {
      toast.error(error.message || 'Не удалось загрузить голосовое сообщение');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    stopRecording();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
    if (onCancel) {
      onCancel();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (audioUrl && audioBlob) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
        <button
          onClick={playPreview}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white hover:bg-primary-600 transition"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500" style={{ width: '100%' }} />
            </div>
            <span className="text-xs text-neutral-400 min-w-[40px] text-right">
              {formatTime(recordingTime)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 text-sm text-neutral-400 hover:text-white transition"
            disabled={isUploading}
          >
            Отмена
          </button>
          <button
            onClick={handleSend}
            disabled={isUploading}
            className="px-4 py-1.5 rounded-full bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Загрузка...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Отправить</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
      {!isRecording ? (
        <>
          <button
            onClick={startRecording}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition animate-pulse"
          >
            <Mic className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm text-neutral-400">Нажмите для начала записи</p>
          </div>
        </>
      ) : (
        <>
          <button
            onClick={stopRecording}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition"
          >
            <Square className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 animate-pulse" style={{ width: '100%' }} />
              </div>
              <span className="text-xs text-neutral-400 min-w-[40px] text-right">
                {formatTime(recordingTime)}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">Идет запись...</p>
          </div>
          {isPaused ? (
            <button
              onClick={resumeRecording}
              className="px-3 py-1.5 text-sm text-neutral-400 hover:text-white transition"
            >
              Продолжить
            </button>
          ) : (
            <button
              onClick={pauseRecording}
              className="px-3 py-1.5 text-sm text-neutral-400 hover:text-white transition"
            >
              Пауза
            </button>
          )}
        </>
      )}
    </div>
  );
}



