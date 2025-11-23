'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  isOwn?: boolean;
}

export default function VoiceMessagePlayer({ audioUrl, isOwn = false }: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 min-w-[200px] max-w-[300px]">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <button
        onClick={togglePlay}
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition ${
          isOwn
            ? 'bg-white/20 hover:bg-white/30 text-white'
            : 'bg-primary-500/20 hover:bg-primary-500/30 text-primary-300'
        }`}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                isOwn ? 'bg-white/40' : 'bg-primary-500/40'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={`text-xs min-w-[40px] text-right ${
            isOwn ? 'text-white/70' : 'text-neutral-400'
          }`}>
            {formatTime(isPlaying ? currentTime : duration)}
          </span>
        </div>
        <p className={`text-xs ${
          isOwn ? 'text-white/60' : 'text-neutral-500'
        }`}>
          Голосовое сообщение
        </p>
      </div>
    </div>
  );
}



