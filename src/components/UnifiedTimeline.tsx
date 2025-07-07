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

  const handleSaveSection = () => {
    if (!formData.name.trim()) return;

    if (editingSection) {
      const updatedSections = sections.map(section =>
        section.id === editingSection.id
          ? { ...section, ...formData }
          : section
      );
      
      const adjustedSections = autoAdjustSectionTimes(updatedSections, editingSection.id);
      onSectionsUpdate(adjustedSections);
    } else {
      const newSection: SongSection = {
        id: Date.now().toString(),
        name: formData.name,
        startTime: formData.startTime,
        endTime: formData.endTime,
        lyrics: ''
      };
      
      const newSections = [...sections, newSection];
      const adjustedSections = autoAdjustSectionTimes(newSections, newSection.id);
      onSectionsUpdate(adjustedSections);
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

  return (
    <div className="space-y-8">
      <audio ref={audioRef} src={audioUrl} />
      
      {/* Album Art and Player Controls */}
      <div className="space-y-3">
        {/* Album Art */}
        <div className="flex justify-center">
          <div className="w-64 h-64 bg-gradient-music rounded-3xl shadow-large flex items-center justify-center">
            <div className="text-6xl text-white/80 font-light">♪</div>
          </div>
        </div>

        {/* Song Info */}
        {currentSectionData && (
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-1">
              {currentSectionData.name}
            </h2>
            <p className="text-muted-foreground">
              {audioFile?.name || 'Unknown Track'}
            </p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateToSection('prev')}
            className="w-12 h-12 text-muted-foreground hover:text-foreground rounded-full"
          >
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button
            variant="default"
            size="icon"
            onClick={handlePlay}
            className="w-16 h-16 bg-music-primary hover:bg-music-primary/90 text-white rounded-full shadow-large transition-transform hover:scale-105"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateToSection('next')}
            className="w-12 h-12 text-muted-foreground hover:text-foreground rounded-full"
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Song Sections</h3>
          <p className="text-muted-foreground text-sm">
            Manage your song structure - sections automatically adjust to prevent gaps
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddSection} className="bg-music-primary text-white shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </DialogTrigger>
          
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
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: Number(e.target.value) }))}
                    className="bg-background/50 border-border/50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="end-time" className="text-foreground">End Time (seconds)</Label>
                  <Input
                    id="end-time"
                    type="number"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: Number(e.target.value) }))}
                    className="bg-background/50 border-border/50"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSection} className="bg-music-primary text-white">
                  {editingSection ? 'Update' : 'Add'} Section
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Visual Timeline */}
      <div className="space-y-4">
        <div className="relative">
          <div className="h-20 bg-muted/20 rounded-xl relative overflow-hidden border border-border/30">
            {/* Progress Bar */}
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-music-primary/30 to-music-primary/50 transition-all duration-200"
              style={{ width: `${progressPercentage}%` }}
            />
            
            {/* Current Time Indicator */}
            <div
              className="absolute top-0 w-1 h-full bg-music-primary shadow-glow transition-all duration-200 z-10"
              style={{ left: `${progressPercentage}%` }}
            />

            {/* Section Markers */}
            {sortedSections.map((section, index) => {
              const leftPercentage = duration > 0 ? (section.startTime / duration) * 100 : 0;
              const widthPercentage = duration > 0 ? ((section.endTime - section.startTime) / duration) * 100 : 0;
              
              return (
                <div
                  key={section.id}
                  className={cn(
                    "absolute top-0 h-full border-l border-r border-border/50 cursor-pointer transition-all duration-200 hover:bg-music-primary/20",
                    currentSection === section.id && "bg-music-primary/30 shadow-inner"
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

          {/* Section Labels on Timeline */}
          <div className="relative mt-2 h-6">
            {sortedSections.map((section) => {
              const leftPercentage = duration > 0 ? (section.startTime / duration) * 100 : 0;
              
              return (
                <div
                  key={section.id}
                  className="absolute text-xs text-muted-foreground font-medium"
                  style={{ left: `${leftPercentage}%` }}
                >
                  {section.name}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section Cards */}
      <div className="grid gap-3">
        {sortedSections.map((section, index) => (
          <Card
            key={section.id}
            className={cn(
              "p-4 border transition-all duration-200 hover:shadow-lg cursor-pointer group",
              currentSection === section.id
                ? "border-music-primary bg-music-primary/10 shadow-glow"
                : "border-border/30 bg-card/50 hover:bg-card/80"
            )}
            onClick={() => {
              setCurrentSection(section.id);
              onSectionClick(section.id);
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 w-8 h-8 p-0 hover:bg-music-primary/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSectionClick(section.id);
                  }}
                >
                  <Play className="w-3 h-3" />
                </Button>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-semibold text-foreground text-lg">{section.name}</h4>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs font-medium",
                        currentSection === section.id ? "bg-music-primary/20 text-music-primary" : ""
                      )}
                    >
                      {formatTime(section.startTime)} - {formatTime(section.endTime)}
                    </Badge>
                  </div>
                  
                  {section.lyrics && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {section.lyrics.split('\n')[0] || 'Empty lyrics'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditSection(section)}
                  className="w-8 h-8 p-0 hover:bg-music-primary/20"
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSection(section.id)}
                  className="w-8 h-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {sections.length === 0 && (
        <div className="text-center p-12 text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted/20 rounded-full flex items-center justify-center">
            <div className="text-2xl">♪</div>
          </div>
          <p className="text-lg">No sections yet</p>
          <p className="text-sm mt-1">Add your first section to get started with structuring your song</p>
        </div>
      )}
    </div>
  );
};