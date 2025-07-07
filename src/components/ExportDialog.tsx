import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SongSection } from './SongwriterTool';
import { ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportDialogProps {
  sections: SongSection[];
  audioFile: File | null;
}

export const ExportDialog = ({ sections, audioFile }: ExportDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeTimestamps: true,
    includeRhymes: true,
    separateFiles: false
  });
  const { toast } = useToast();

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const detectRhymes = (text: string): string[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const rhymeWords: string[] = [];
    
    lines.forEach(line => {
      const words = line.trim().split(/\s+/).filter(word => word.length > 2);
      words.forEach(word => {
        const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
        if (cleanWord.length > 2) {
          rhymeWords.push(cleanWord);
        }
      });
    });

    return rhymeWords;
  };

  const generateTextContent = () => {
    const songTitle = audioFile ? audioFile.name.replace(/\.[^/.]+$/, '') : 'Untitled Song';
    let content = `${songTitle}\n${'='.repeat(songTitle.length)}\n\n`;

    if (exportOptions.separateFiles) {
      // Export each section separately
      sections.forEach(section => {
        let sectionContent = `${section.name}\n${'-'.repeat(section.name.length)}\n\n`;
        
        if (exportOptions.includeTimestamps) {
          sectionContent += `Time: ${formatTime(section.startTime)} - ${formatTime(section.endTime)}\n\n`;
        }

        if (section.lyrics) {
          sectionContent += `${section.lyrics}\n\n`;
          
          if (exportOptions.includeRhymes) {
            const rhymes = detectRhymes(section.lyrics);
            if (rhymes.length > 0) {
              sectionContent += `Rhyme words: ${rhymes.join(', ')}\n\n`;
            }
          }
        } else {
          sectionContent += '[No lyrics]\n\n';
        }

        // Download individual section file
        const blob = new Blob([sectionContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${songTitle} - ${section.name}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      });
    } else {
      // Export all sections in one file
      sections.forEach((section, index) => {
        content += `${section.name}\n${'-'.repeat(section.name.length)}\n\n`;
        
        if (exportOptions.includeTimestamps) {
          content += `Time: ${formatTime(section.startTime)} - ${formatTime(section.endTime)}\n\n`;
        }

        if (section.lyrics) {
          content += `${section.lyrics}\n\n`;
          
          if (exportOptions.includeRhymes) {
            const rhymes = detectRhymes(section.lyrics);
            if (rhymes.length > 0) {
              content += `Rhyme words: ${rhymes.join(', ')}\n\n`;
            }
          }
        } else {
          content += '[No lyrics]\n\n';
        }

        if (index < sections.length - 1) {
          content += '\n';
        }
      });

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${songTitle} - Lyrics.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleExport = () => {
    if (sections.length === 0) {
      toast({
        title: "No content to export",
        description: "Add some sections and lyrics first.",
        variant: "destructive"
      });
      return;
    }

    generateTextContent();
    setIsOpen(false);
    
    toast({
      title: "Export successful!",
      description: "Your lyrics have been downloaded as a text file."
    });
  };

  const copyToClipboard = () => {
    const songTitle = audioFile ? audioFile.name.replace(/\.[^/.]+$/, '') : 'Untitled Song';
    let content = `${songTitle}\n${'='.repeat(songTitle.length)}\n\n`;

    sections.forEach((section, index) => {
      content += `${section.name}\n${'-'.repeat(section.name.length)}\n\n`;
      
      if (exportOptions.includeTimestamps) {
        content += `Time: ${formatTime(section.startTime)} - ${formatTime(section.endTime)}\n\n`;
      }

      if (section.lyrics) {
        content += `${section.lyrics}\n\n`;
      } else {
        content += '[No lyrics]\n\n';
      }

      if (index < sections.length - 1) {
        content += '\n';
      }
    });

    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard!",
      description: "Your lyrics have been copied to the clipboard."
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="space-x-2">
          <ArrowDown className="w-4 h-4" />
          <span>Export</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-current rounded opacity-80" />
            <span>Export Lyrics</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Export Options</h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timestamps"
                  checked={exportOptions.includeTimestamps}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeTimestamps: !!checked }))
                  }
                />
                <Label htmlFor="timestamps" className="text-sm">
                  Include timestamps
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rhymes"
                  checked={exportOptions.includeRhymes}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeRhymes: !!checked }))
                  }
                />
                <Label htmlFor="rhymes" className="text-sm">
                  Include detected rhymes
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="separate"
                  checked={exportOptions.separateFiles}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, separateFiles: !!checked }))
                  }
                />
                <Label htmlFor="separate" className="text-sm">
                  Export sections separately
                </Label>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={copyToClipboard}
            >
              <div className="w-4 h-4 mr-2 bg-current rounded-sm opacity-80" />
              Copy
            </Button>
            
            <Button
              onClick={handleExport}
              className="flex-1 bg-gradient-primary shadow-glow"
            >
              <ArrowDown className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};