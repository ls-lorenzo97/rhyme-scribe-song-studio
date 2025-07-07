import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SongSection } from './SongwriterTool';
import { Play, Plus, Edit3, Trash2 } from 'lucide-react';

interface UnifiedTimelineProps {
  sections: SongSection[];
  currentTime: number;
  duration: number;
  currentSection: string | null;
  onSectionClick: (sectionId: string) => void;
  onSectionsUpdate: (sections: SongSection[]) => void;
  setCurrentSection: (sectionId: string) => void;
}

export const UnifiedTimeline = ({
  sections,
  currentTime,
  duration,
  currentSection,
  onSectionClick,
  onSectionsUpdate,
  setCurrentSection
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

  const sortedSections = [...sections].sort((a, b) => a.startTime - b.startTime);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Song Structure</h3>
          <p className="text-sm text-muted-foreground">
            Click sections to jump or edit
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

      {/* Compact Section List */}
      <div className="space-y-2">
        {sortedSections.map((section, index) => (
          <div
            key={section.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md group",
              currentSection === section.id
                ? "border-music-primary bg-music-primary/10"
                : "border-border/30 bg-card/30 hover:bg-card/50"
            )}
            onClick={() => {
              setCurrentSection(section.id);
              onSectionClick(section.id);
            }}
          >
            <div className="flex items-center space-x-3 flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 w-6 h-6 p-0 hover:bg-music-primary/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onSectionClick(section.id);
                }}
              >
                <Play className="w-3 h-3" />
              </Button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-foreground truncate">{section.name}</span>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {formatTime(section.startTime)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditSection(section)}
                className="w-6 h-6 p-0 hover:bg-music-primary/20"
              >
                <Edit3 className="w-3 h-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteSection(section.id)}
                className="w-6 h-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
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