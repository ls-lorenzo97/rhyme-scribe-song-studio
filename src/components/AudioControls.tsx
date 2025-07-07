import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause } from 'lucide-react';
import { SongSection } from './SongwriterTool';

interface AudioControlsProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  audioUrl: string;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  currentSection: string | null;
  sections: SongSection[];
}

export const AudioControls = ({
  audioRef,
  audioUrl,
  isPlaying,
  setIsPlaying,
  currentTime,
  setCurrentTime,
  duration,
  setDuration,
  currentSection,
  sections
}: AudioControlsProps) => {
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [audioRef, isPlaying, setIsPlaying]);

  const handleStop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [audioRef, setIsPlaying, setCurrentTime]);

  const handleSeek = useCallback((value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  }, [audioRef, setCurrentTime]);

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
  }, [audioRef, setCurrentTime, setDuration, setIsPlaying]);

  const currentSectionData = sections.find(s => s.id === currentSection);

  return (
    <div className="space-y-6">
      <audio ref={audioRef} src={audioUrl} />
      
      <div className="flex items-center justify-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handleStop}
          className="w-12 h-12"
        >
          <div className="w-3 h-3 bg-current rounded-sm" />
        </Button>
        
        <Button
          variant="default"
          size="icon"
          onClick={handlePlay}
          className="w-16 h-16 bg-gradient-primary shadow-glow"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-1" />
          )}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground min-w-[3rem]">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground min-w-[3rem]">
            {formatTime(duration)}
          </span>
        </div>

        {currentSectionData && (
          <div className="text-center p-4 bg-muted/20 rounded-lg border border-music-primary/30">
            <p className="text-sm text-muted-foreground">Currently Playing</p>
            <p className="font-semibold text-music-primary">
              {currentSectionData.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatTime(currentSectionData.startTime)} - {formatTime(currentSectionData.endTime)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};