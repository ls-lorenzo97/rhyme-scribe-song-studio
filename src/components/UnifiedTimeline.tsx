import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { SongSection } from './SongwriterTool';
import { Play, Pause, Plus, Edit3, Trash2, SkipBack, SkipForward } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface UnifiedTimelineProps {
  sections: SongSection[];
  currentTime: number;
  duration: number;
  currentSection: string | null;
  onSectionClick: (sectionId: string) => void;
  onSectionsUpdate: (sections: SongSection[]) => void;
  setCurrentSection: (sectionId: string) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  audioUrl: string;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  audioFile?: File;
}

export const UnifiedTimeline = ({
  sections,
  currentTime,
  duration,
  currentSection,
  onSectionClick,
  onSectionsUpdate,
  setCurrentSection,
  audioRef,
  audioUrl,
  isPlaying,
  setIsPlaying,
  setCurrentTime,
  setDuration,
  audioFile
}: UnifiedTimelineProps) => {
  const [editingSection, setEditingSection] = useState<SongSection | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startTime: 0,
    endTime: 30
  });

  const progressPercentage = useMemo(() => {
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  }, [currentTime, duration]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const autoAdjustSectionTimes = (sectionList: SongSection[], changedSectionId: string) => {
    const sortedSections = [...sectionList].sort((a, b) => a.startTime - b.startTime);
    const changedIndex = sortedSections.findIndex(s => s.id === changedSectionId);
    
    if (changedIndex === -1) return sectionList;
    
    const changedSection = sortedSections[changedIndex];
    
    // Adjust previous section's end time to match this section's start time
    if (changedIndex > 0) {
      sortedSections[changedIndex - 1].endTime = changedSection.startTime;
    }
    
    // Adjust next section's start time to match this section's end time
    if (changedIndex < sortedSections.length - 1) {
      sortedSections[changedIndex + 1].startTime = changedSection.endTime;
    }
    
    return sortedSections;
  };

  const handleAddSection = () => {
    setEditingSection(null);
    const lastSection = sections.sort((a, b) => a.startTime - b.startTime).pop();
    const startTime = lastSection ? lastSection.endTime : 0;
    setFormData({ name: '', startTime, endTime: startTime + 30 });
    setIsDialogOpen(true);
  };

  const handleEditSection = (section: SongSection) => {
    setEditingSection(section);
    setFormData({
      name: section.name,
      startTime: section.startTime,
      endTime: section.endTime
    });
    setIsDialogOpen(true);
  };

  const checkForOverlap = (newSection: { startTime: number; endTime: number; id?: string }) => {
    return sections.some(section => {
      // Skip checking against the section being edited
      if (editingSection && section.id === editingSection.id) return false;
      
      // Check if new section overlaps with existing section
      const newStart = newSection.startTime;
      const newEnd = newSection.endTime;
      const existingStart = section.startTime;
      const existingEnd = section.endTime;
      
      // Check for any overlap:
      // 1. New section starts during existing section
      // 2. New section ends during existing section  
      // 3. New section completely encompasses existing section
      // 4. Existing section completely encompasses new section
      return (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd) ||
        (existingStart <= newStart && existingEnd >= newEnd)
      );
    });
  };

  const handleSaveSection = () => {
    if (!formData.name.trim()) return;
    
    // Validate that start time is before end time
    if (formData.startTime >= formData.endTime) {
      alert('Start time must be before end time');
      return;
    }

    if (editingSection) {
      // First, update the edited section
      let updatedSections = sections.map(section =>
        section.id === editingSection.id
          ? { ...section, ...formData }
          : section
      );

      // Auto-adjust any overlapping sections
      updatedSections = updatedSections.map(section => {
        if (section.id === editingSection.id) return section;
        
        // Check if this section overlaps with the edited section
        const editedSection = updatedSections.find(s => s.id === editingSection.id)!;
        
        // If current section overlaps with edited section, adjust it
        if (section.startTime < editedSection.endTime && section.endTime > editedSection.startTime) {
          // If edited section completely encompasses this section, remove overlap by adjusting times
          if (editedSection.startTime <= section.startTime && editedSection.endTime >= section.endTime) {
            return { ...section, startTime: editedSection.endTime, endTime: editedSection.endTime + (section.endTime - section.startTime) };
          }
          // If this section starts before edited section but overlaps
          else if (section.startTime < editedSection.startTime) {
            return { ...section, endTime: editedSection.startTime };
          }
          // If this section starts after edited section start but before its end
          else {
            return { ...section, startTime: editedSection.endTime };
          }
        }
        
        return section;
      });
      
      onSectionsUpdate(updatedSections);
    } else {
      const newSection: SongSection = {
        id: Date.now().toString(),
        name: formData.name,
        startTime: formData.startTime,
        endTime: formData.endTime,
        lyrics: ''
      };
      
      // Auto-adjust any overlapping sections with the new section
      let updatedSections = [...sections, newSection];
      updatedSections = updatedSections.map(section => {
        if (section.id === newSection.id) return section;
        
        // Check if this section overlaps with the new section
        if (section.startTime < newSection.endTime && section.endTime > newSection.startTime) {
          // If new section completely encompasses this section
          if (newSection.startTime <= section.startTime && newSection.endTime >= section.endTime) {
            return { ...section, startTime: newSection.endTime, endTime: newSection.endTime + (section.endTime - section.startTime) };
          }
          // If this section starts before new section but overlaps
          else if (section.startTime < newSection.startTime) {
            return { ...section, endTime: newSection.startTime };
          }
          // If this section starts after new section start but before its end
          else {
            return { ...section, startTime: newSection.endTime };
          }
        }
        
        return section;
      });
      
      onSectionsUpdate(updatedSections);
    }

    setIsDialogOpen(false);
    setEditingSection(null);
  };

  const handleDeleteSection = (sectionId: string) => {
    const updatedSections = sections.filter(s => s.id !== sectionId);
    onSectionsUpdate(updatedSections);
    
    if (currentSection === sectionId && updatedSections.length > 0) {
      setCurrentSection(updatedSections[0].id);
    }
  };

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

  // Audio control functions
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

  const handleSeek = useCallback((value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  }, [audioRef, setCurrentTime]);

  const sortedSections = [...sections].sort((a, b) => a.startTime - b.startTime);
  const currentSectionData = sections.find(s => s.id === currentSection);

  const navigateToSection = useCallback((direction: 'prev' | 'next') => {
    const currentIndex = sortedSections.findIndex(s => s.id === currentSection);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex >= 0 && targetIndex < sortedSections.length) {
      const targetSection = sortedSections[targetIndex];
      onSectionClick(targetSection.id);
    }
  }, [sortedSections, currentSection, onSectionClick]);

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

  // Spacebar play/pause functionality
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle spacebar
      if (event.code === 'Space') {
        // Check if any text input is focused
        const activeElement = document.activeElement;
        const isTextInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).contentEditable === 'true'
        );

        // If no text input is focused, handle play/pause
        if (!isTextInputFocused) {
          event.preventDefault(); // Prevent page scroll
          handlePlay();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePlay]);

  // Apple Music style: single compact horizontal bar
  return (
    <div className="w-full flex items-center gap-2 bg-background rounded-xl p-2 shadow-sm border border-border/40 overflow-x-auto">
      {/* Player left-aligned, compact, centered */}
      <div className="flex flex-col items-center justify-center mr-2 min-w-[80px]">
        <audio ref={audioRef} src={audioUrl} />
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous section"
            onClick={() => navigateToSection('prev')}
            className="w-8 h-8 text-muted-foreground hover:text-foreground rounded-full focus:ring-2 focus:ring-[color:var(--accent)]"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            variant="primary"
            size="icon"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={handlePlay}
            className="w-12 h-12 bg-[color:var(--accent)] hover:bg-[color:var(--accent)]/90 text-white rounded-full shadow-glow transition-transform duration-200 hover:scale-110 focus:ring-2 focus:ring-[color:var(--accent)]"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next section"
            onClick={() => navigateToSection('next')}
            className="w-8 h-8 text-muted-foreground hover:text-foreground rounded-full focus:ring-2 focus:ring-[color:var(--accent)]"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
        {/* Progress Bar */}
        <div className="w-28 flex flex-col items-center mt-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full h-1"
          />
          <div className="flex justify-between w-full text-[10px] text-muted-foreground mt-0.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
      {/* Timeline + Section pills, horizontally scrollable */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        {/* Section Labels */}
        <div className="flex justify-between w-full px-1 min-w-0">
          {sortedSections.map((section) => (
            <Tooltip key={section.id}>
              <TooltipTrigger asChild>
                <div
                  className="text-xs text-muted-foreground font-medium text-center flex-1 truncate cursor-default"
                  style={{ minWidth: 0 }}
                >
                  {section.name}
                </div>
              </TooltipTrigger>
              <TooltipContent>{section.name}</TooltipContent>
            </Tooltip>
          ))}
        </div>
        {/* Timeline Bar with Section Pills */}
        <div className="flex w-full h-16 rounded-xl overflow-x-auto border border-separator bg-secondarySystemBackground gap-5 scrollbar-thin scrollbar-thumb-accent/20 snap-x snap-mandatory py-1 px-2">
          {sortedSections.map((section, idx) => {
            const hasLyrics = !!section.lyrics && section.lyrics.trim().length > 0;
            const isActive = currentSection === section.id;
            return (
              <div
                key={section.id}
                tabIndex={0}
                aria-label={`Section ${section.name}`}
                className={cn(
                  "flex flex-col items-center justify-center px-5 py-2 min-w-[100px] max-w-[140px] rounded-full cursor-pointer border border-separator transition-all duration-200 relative group bg-secondarySystemBackground overflow-hidden focus:ring-2 focus:ring-accent outline-none",
                  isActive ? "bg-accentSystemFill shadow-lg scale-105 z-10 border-accent transition-all duration-200" : "hover:bg-tertiarySystemFill hover:scale-105",
                )}
                style={{ minWidth: 0 }}
                onClick={() => {
                  setCurrentSection(section.id);
                  onSectionClick(section.id);
                }}
              >
                {/* Nome sezione sempre centrato, ellissi, tooltip se lungo */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={cn("font-semibold text-[15px] text-label truncate max-w-[90px] text-center block", isActive ? "text-label" : "text-secondaryLabel")}>{section.name}</span>
                  </TooltipTrigger>
                  {section.name.length > 10 && <TooltipContent>{section.name}</TooltipContent>}
                </Tooltip>
                {/* Badge tempo Apple-style sotto, sempre leggibile */}
                <span className={cn(
                  "mt-1 px-2 py-0.5 rounded-full text-[13px] font-bold min-w-[60px] text-center bg-tertiarySystemFill border border-separator text-secondaryLabel shadow-sm",
                  isActive ? "bg-accentSystemFill text-label border-accent" : ""
                )}>
                  {formatTime(section.startTime)} - {formatTime(section.endTime)}
                </span>
                {/* Colonna icone a destra, solo su hover/attivo, MA mai sopra testo */}
                <div className={cn(
                  "absolute right-2 top-1 flex flex-col gap-1 transition-opacity duration-200 z-20",
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Edit section"
                        onClick={e => { e.stopPropagation(); handleEditSection(section); }}
                        className="w-6 h-6 p-0 focus:ring-2 focus:ring-accent"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit section</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Delete section"
                        onClick={e => { e.stopPropagation(); handleDeleteSection(section.id); }}
                        className="w-6 h-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 focus:ring-2 focus:ring-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete section</TooltipContent>
                  </Tooltip>
                </div>
                {/* Play icon solo su hover/attivo, MA mai sopra testo */}
                <div className={cn(
                  "absolute left-2 top-1 transition-opacity duration-200 z-20",
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Play ${section.name}`}
                        className="w-6 h-6 p-0 focus:ring-2 focus:ring-accent"
                        onClick={e => { e.stopPropagation(); onSectionClick(section.id); }}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Play {section.name}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Add Section Button */}
      <div className="ml-2 flex items-center">
        <Button onClick={handleAddSection} className="bg-[color:var(--accent)] text-white font-semibold px-4 py-2 rounded-lg shadow-glow focus:ring-2 focus:ring-[color:var(--accent)]">
          <Plus className="w-4 h-4 mr-2" />
          Add Section
        </Button>
      </div>
      {/* Dialog per edit/add section (come prima) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/20">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingSection ? 'Edit Section' : 'Add New Section'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="section-name" className="text-foreground">Section Name</Label>
              <Input
                id="section-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Verse 1, Chorus, Bridge"
                className="bg-background/50 border-border/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time" className="text-foreground">Start Time (seconds)</Label>
                <Input
                  id="start-time"
                  type="number"
                  value={formData.startTime === 0 ? '' : formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value === '' ? 0 : Number(e.target.value) }))}
                  onFocus={(e) => e.target.select()}
                  className="bg-background/50 border-border/50"
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="end-time" className="text-foreground">End Time (seconds)</Label>
                <Input
                  id="end-time"
                  type="number"
                  value={formData.endTime === 0 ? '' : formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value === '' ? 0 : Number(e.target.value) }))}
                  onFocus={(e) => e.target.select()}
                  className="bg-background/50 border-border/50"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSection} className="bg-[color:var(--accent)] text-white">
                {editingSection ? 'Update' : 'Add'} Section
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};