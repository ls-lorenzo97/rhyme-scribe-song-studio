import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioUploadProps {
  onFileUpload: (file: File) => void;
}

export const AudioUpload = ({ onFileUpload }: AudioUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(file => file.type.startsWith('audio/'));
    
    if (audioFile) {
      onFileUpload(audioFile);
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  return (
    <div className="text-center space-y-8">
      <div className="flex justify-center">
        <div className="w-24 h-24 bg-gradient-music rounded-full flex items-center justify-center shadow-card">
          <div className="text-3xl font-medium text-white">♪</div>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-3">
          Add Music
        </h2>
        <p className="text-muted-foreground text-base">
          Choose a song from your library or drag it here
        </p>
      </div>

      <div
        className={cn(
          "border-2 border-dashed rounded-2xl p-16 transition-all duration-200 cursor-pointer",
          "hover:bg-muted/30 hover:border-music-accent",
          isDragOver ? "border-music-accent bg-music-accent/10 scale-[1.02]" : "border-border/40"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('audio-upload')?.click()}
      >
        <div className="space-y-6">
          <ArrowUp className="w-16 h-16 text-muted-foreground mx-auto" />
          <div>
            <p className="text-xl font-medium text-foreground mb-2">
              Drag and Drop
            </p>
            <p className="text-muted-foreground">
              MP3, WAV, M4A, and other audio formats
            </p>
          </div>
          <Button 
            variant="default" 
            size="lg" 
            className="bg-music-primary hover:bg-music-primary/90 text-white rounded-full px-8 py-3 font-medium"
          >
            Browse Files
          </Button>
        </div>
      </div>

      <input
        id="audio-upload"
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};