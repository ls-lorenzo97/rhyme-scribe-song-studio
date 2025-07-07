import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SongSection } from './SongwriterTool';

interface TimelineProps {
  sections: SongSection[];
  currentTime: number;
  duration: number;
  currentSection: string | null;
  onSectionClick: (sectionId: string) => void;
}

export const Timeline = ({
  sections,
  currentTime,
  duration,
  currentSection,
  onSectionClick
}: TimelineProps) => {
  
  const progressPercentage = useMemo(() => {
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  }, [currentTime, duration]);

  const getSectionColors = (index: number) => {
    const colors = [
      'bg-rhyme-1/20 border-rhyme-1/50 text-rhyme-1',
      'bg-rhyme-2/20 border-rhyme-2/50 text-rhyme-2',
      'bg-rhyme-3/20 border-rhyme-3/50 text-rhyme-3',
      'bg-rhyme-4/20 border-rhyme-4/50 text-rhyme-4',
      'bg-rhyme-5/20 border-rhyme-5/50 text-rhyme-5',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Song Timeline</h3>
        <p className="text-sm text-muted-foreground">
          Click on any section to jump to that part of the song
        </p>
      </div>

      {/* Visual Timeline */}
      <div className="relative">
        <div className="h-16 bg-muted/30 rounded-lg relative overflow-hidden border border-border">
          {/* Progress Bar */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-waveform/50 transition-all duration-200"
            style={{ width: `${progressPercentage}%` }}
          />
          
          {/* Current Time Indicator */}
          <div
            className="absolute top-0 w-0.5 h-full bg-music-primary shadow-glow transition-all duration-200"
            style={{ left: `${progressPercentage}%` }}
          />

          {/* Section Markers */}
          {sections.map((section, index) => {
            const leftPercentage = duration > 0 ? (section.startTime / duration) * 100 : 0;
            const widthPercentage = duration > 0 ? ((section.endTime - section.startTime) / duration) * 100 : 0;
            
            return (
              <div
                key={section.id}
                className={cn(
                  "absolute top-0 h-full border-l border-r border-border/50 cursor-pointer transition-all duration-200 hover:bg-music-primary/10",
                  currentSection === section.id && "bg-music-primary/20"
                )}
                style={{
                  left: `${leftPercentage}%`,
                  width: `${widthPercentage}%`
                }}
                onClick={() => onSectionClick(section.id)}
              />
            );
          })}
        </div>

        {/* Section Labels */}
        <div className="relative mt-2">
          {sections.map((section, index) => {
            const leftPercentage = duration > 0 ? (section.startTime / duration) * 100 : 0;
            
            return (
              <div
                key={section.id}
                className="absolute text-xs text-muted-foreground"
                style={{ left: `${leftPercentage}%` }}
              >
                {section.name}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sections.map((section, index) => (
          <Button
            key={section.id}
            variant={currentSection === section.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSectionClick(section.id)}
            className={cn(
              "transition-all duration-200",
              currentSection === section.id ? 
                "bg-gradient-primary shadow-glow" : 
                getSectionColors(index)
            )}
          >
            <div className="text-center">
              <div className="font-medium">{section.name}</div>
              <div className="text-xs opacity-80">
                {Math.floor(section.startTime)}s - {Math.floor(section.endTime)}s
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};