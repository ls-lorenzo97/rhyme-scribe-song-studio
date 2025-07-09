import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SongSection } from './SongwriterTool';
import { Play, Clock, Music } from 'lucide-react';

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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getSectionColor = (index: number, isActive: boolean) => {
    const colors = [
      { bg: 'hsl(var(--primary))', accent: 'hsl(var(--primary)/0.2)' },
      { bg: 'hsl(var(--secondary))', accent: 'hsl(var(--secondary)/0.2)' },
      { bg: 'hsl(var(--accent))', accent: 'hsl(var(--accent)/0.2)' },
      { bg: 'hsl(var(--muted))', accent: 'hsl(var(--muted)/0.2)' },
    ];
    const color = colors[index % colors.length];
    return isActive ? color.bg : color.accent;
  };

  const sortedSections = useMemo(() => {
    return [...sections].sort((a, b) => a.startTime - b.startTime);
  }, [sections]);

  if (sections.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No sections defined. Add sections to see your song timeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground mb-2">Song Timeline</h3>
        <p className="text-sm text-muted-foreground">
          Navigate through your song structure • Current: {formatTime(currentTime)} / {formatTime(duration)}
        </p>
      </div>

      {/* Main Timeline Visualization */}
      <div className="relative bg-card/50 rounded-xl p-6 border border-border">
        {/* Overall Progress Bar */}
        <div className="mb-6">
          <div className="h-3 bg-muted/30 rounded-full relative overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
            <div
              className="absolute top-0 w-1 h-full bg-primary shadow-lg transition-all duration-200"
              style={{ left: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0:00</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Vertical Section Timeline */}
        <div className="space-y-4">
          {sortedSections.map((section, index) => {
            const isActive = currentSection === section.id;
            const sectionProgress = duration > 0 ? 
              Math.max(0, Math.min(100, ((currentTime - section.startTime) / (section.endTime - section.startTime)) * 100)) : 0;
            const isPlaying = currentTime >= section.startTime && currentTime <= section.endTime;

            return (
              <Card 
                key={section.id}
                className={cn(
                  "relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg group",
                  isActive ? "ring-2 ring-primary shadow-lg scale-[1.02]" : "hover:scale-[1.01]"
                )}
                onClick={() => onSectionClick(section.id)}
              >
                {/* Section Progress Background */}
                {isPlaying && (
                  <div
                    className="absolute inset-0 bg-primary/10 transition-all duration-200"
                    style={{ width: `${sectionProgress}%` }}
                  />
                )}

                <div className="p-4 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Section Color Indicator */}
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: getSectionColor(index, isActive) }}
                      />
                      
                      {/* Section Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className={cn(
                          "font-semibold text-lg truncate",
                          isActive ? "text-primary" : "text-foreground"
                        )}>
                          {section.name}
                        </h4>
                        <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(section.startTime)} - {formatTime(section.endTime)}</span>
                          </div>
                          <span>•</span>
                          <span>{formatTime(section.endTime - section.startTime)} duration</span>
                          {section.lyrics && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px]">
                                {section.lyrics.split('\n')[0] || 'No lyrics'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Play Button */}
                      <Button
                        variant={isActive ? "primary" : "outline"}
                        size="sm"
                        className={cn(
                          "flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                          isActive && "opacity-100"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSectionClick(section.id);
                        }}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Jump
                      </Button>
                    </div>
                  </div>

                  {/* Section Progress Bar (when playing) */}
                  {isPlaying && (
                    <div className="mt-3">
                      <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-200"
                          style={{ width: `${sectionProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sortedSections.slice(0, 4).map((section, index) => (
          <Button
            key={section.id}
            variant={currentSection === section.id ? "primary" : "outline"}
            onClick={() => onSectionClick(section.id)}
            className={cn(
              "h-auto p-3 flex flex-col space-y-1 transition-all duration-200",
              currentSection === section.id && "shadow-lg"
            )}
          >
            <span className="font-semibold text-sm truncate w-full">{section.name}</span>
            <span className="text-xs opacity-70">{formatTime(section.startTime)}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};