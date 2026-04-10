import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface AudioPlayerProps {
  url: string;
  title: string;
  subtitle: string;
  translationEn?: string;
  translationBn?: string;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  url, title, subtitle, translationEn, translationBn, onClose, onNext, onPrev 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const playTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      // Clear any pending play requests
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }

      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.load();
      
      // Small delay to ensure the load request is processed before play
      playTimeoutRef.current = setTimeout(() => {
        const playPromise = audioRef.current?.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setIsPlaying(true);
          }).catch(error => {
            // Only log if it's not an interruption error
            if (error.name !== 'AbortError') {
              console.error("Playback failed:", error.message);
            }
            setIsPlaying(false);
          });
        }
      }, 50);
    }

    return () => {
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
    };
  }, [url]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setIsPlaying(true);
          }).catch(error => {
            if (error.name !== 'AbortError') {
              console.error("Playback failed:", error.message);
            }
          });
        }
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
      const currentProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      if (isFinite(currentProgress)) {
        setProgress(currentProgress);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && isFinite(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
      const time = (value[0] / 100) * audioRef.current.duration;
      if (isFinite(time)) {
        audioRef.current.currentTime = time;
        setProgress(value[0]);
      }
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (audioRef.current) {
      const newVolume = value[0];
      if (isFinite(newVolume)) {
        audioRef.current.volume = newVolume;
        setVolume(newVolume);
      }
    }
  };

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const target = e.target as HTMLAudioElement;
    console.error("Audio error code:", target.error?.code, "message:", target.error?.message);
    toast.error("Failed to load audio. Please check your connection.");
    setIsPlaying(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4"
      >
        <div className="container max-w-4xl mx-auto bg-card border rounded-2xl shadow-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-bold text-sm truncate max-w-[200px]">{title}</span>
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">{subtitle}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onPrev}>
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button 
                variant="default" 
                size="icon" 
                className="h-10 w-10 rounded-full"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={onNext}>
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            <div className="hidden sm:flex items-center gap-2 w-32">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider 
                value={[isFinite(volume) ? volume : 1]} 
                max={1} 
                step={0.01} 
                onValueChange={handleVolumeChange} 
              />
            </div>

            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {(translationEn || translationBn) && (
            <div className="px-2 space-y-1">
              {translationEn && (
                <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1 italic">
                  <span className="font-bold not-italic mr-1">EN:</span> {translationEn}
                </p>
              )}
              {translationBn && (
                <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1 bengali-text">
                  <span className="font-bold mr-1">BN:</span> {translationBn}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono w-8">
              {formatTime(audioRef.current?.currentTime || 0)}
            </span>
            <Slider 
              value={[isFinite(progress) ? progress : 0]} 
              max={100} 
              step={0.1} 
              onValueChange={handleSeek} 
              className="flex-1"
            />
            <span className="text-[10px] font-mono w-8">
              {formatTime(isFinite(duration) ? duration : 0)}
            </span>
          </div>

          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={onNext}
            onError={handleAudioError}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
