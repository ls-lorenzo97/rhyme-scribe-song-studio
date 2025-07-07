import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { SongSection } from './SongwriterTool';
import { ArrowUp, ArrowDown, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionManagerProps {
  sections: SongSection[];
  onSectionsUpdate: (sections: SongSection[]) => void;
  currentSection: string | null;
  setCurrentSection: (sectionId: string) => void;
}

export const SectionManager = ({
  sections,
  onSectionsUpdate,
  currentSection,
  setCurrentSection
}: SectionManagerProps) => {
  const [editingSection, setEditingSection] = useState<SongSection | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    startTime: 0,
    endTime: 30
  });

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAddSection = () => {
    setEditingSection(null);
    setFormData({ name: '', startTime: 0, endTime: 30 });
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

  const handleDeleteSection = (sectionId: string) => {
    const updatedSections = sections.filter(s => s.id !== sectionId);
    onSectionsUpdate(updatedSections);
    
    // If we deleted the current section, select the first one
    if (currentSection === sectionId && updatedSections.length > 0) {
      setCurrentSection(updatedSections[0].id);
    }
  };

  const handleSaveSection = () => {
    if (!formData.name.trim()) return;

    if (editingSection) {
      // Update existing section
      const updatedSections = sections.map(section =>
        section.id === editingSection.id
          ? { ...section, ...formData }
          : section
      );
      onSectionsUpdate(updatedSections);
    } else {
      // Add new section
      const newSection: SongSection = {
        id: Date.now().toString(),
        name: formData.name,
        startTime: formData.startTime,
        endTime: formData.endTime,
        lyrics: ''
      };
      onSectionsUpdate([...sections, newSection]);
    }

    setIsDialogOpen(false);
    setEditingSection(null);
  };

  const getSectionColor = (index: number) => {
    const colors = [
      'border-rhyme-1/50 bg-rhyme-1/10',
      'border-rhyme-2/50 bg-rhyme-2/10',
      'border-rhyme-3/50 bg-rhyme-3/10',
      'border-rhyme-4/50 bg-rhyme-4/10',
      'border-rhyme-5/50 bg-rhyme-5/10',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Song Sections</h3>
          <p className="text-sm text-muted-foreground">
            Manage your song structure and timing
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddSection} className="bg-gradient-primary shadow-glow">
              <ArrowUp className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </DialogTrigger>
          
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>
                {editingSection ? 'Edit Section' : 'Add New Section'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="section-name">Section Name</Label>
                <Input
                  id="section-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Verse 1, Chorus, Bridge"
                  className="bg-background/50"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Start Time (seconds)</Label>
                  <Input
                    id="start-time"
                    type="number"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: Number(e.target.value) }))}
                    className="bg-background/50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="end-time">End Time (seconds)</Label>
                  <Input
                    id="end-time"
                    type="number"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: Number(e.target.value) }))}
                    className="bg-background/50"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSection}>
                  {editingSection ? 'Update' : 'Add'} Section
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {sections.map((section, index) => (
          <Card
            key={section.id}
            className={cn(
              "p-4 border cursor-pointer transition-all duration-200 hover:shadow-md",
              currentSection === section.id
                ? "border-music-primary bg-music-primary/10 shadow-glow"
                : getSectionColor(index)
            )}
            onClick={() => setCurrentSection(section.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium text-foreground">{section.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    <div className="w-3 h-3 mr-1 text-xs">⏱</div>
                    {formatTime(section.startTime)} - {formatTime(section.endTime)}
                  </Badge>
                </div>
                
                {section.lyrics && (
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {section.lyrics.split('\n')[0] || 'Empty lyrics'}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditSection(section)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSection(section.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {sections.length === 0 && (
        <div className="text-center p-8 text-muted-foreground">
          <div className="w-12 h-12 mx-auto mb-4 opacity-50 text-2xl">⏱</div>
          <p>No sections yet. Add your first section to get started!</p>
        </div>
      )}
    </div>
  );
};