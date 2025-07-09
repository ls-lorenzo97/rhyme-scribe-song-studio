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
  audioFile?: File;
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
  sections,
  audioFile
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
    <div className="space-y-8" data-name="audio-controls-root">
      <audio ref={audioRef} src={audioUrl} />
      
      {/* Album Art Placeholder */}
      <div className="flex justify-center" data-name="audio-album-art-row">
        <div className="w-80 h-80 bg-gradient-music rounded-3xl shadow-large flex items-center justify-center" data-name="audio-album-art">
          <div className="text-8xl text-white/80 font-light">♪</div>
        </div>
      </div>

      {/* Song Info */}
      {currentSectionData && (
        <div className="text-center" data-name="audio-song-info">
          <h2 className="text-2xl font-semibold text-foreground mb-1">
            {currentSectionData.name}
          </h2>
          <p className="text-muted-foreground">
            {audioFile?.name || 'Unknown Track'}
          </p>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center justify-center space-x-6" data-name="audio-control-buttons">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleStop}
          className="w-12 h-12 text-muted-foreground hover:text-foreground rounded-full"
          data-name="audio-stop-btn"
        >
          <div className="w-4 h-4 bg-current rounded-sm" />
        </Button>
        
        <Button
          variant="default"
          size="icon"
          onClick={handlePlay}
          className="w-20 h-20 bg-music-primary hover:bg-music-primary/90 text-white rounded-full shadow-large transition-transform hover:scale-105"
          data-name="audio-play-btn"
        >
          {isPlaying ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2" data-name="audio-progress-bar">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="w-full"
          data-name="audio-slider"
        />
        <div className="flex justify-between text-sm text-muted-foreground" data-name="audio-progress-labels">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};