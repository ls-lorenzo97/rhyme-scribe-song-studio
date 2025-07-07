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
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
          <div className="text-2xl font-bold text-primary-foreground">♪</div>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Upload Your Song
        </h2>
        <p className="text-muted-foreground">
          Drop your audio file here or click to browse
        </p>
      </div>

      <Card
        className={cn(
          "border-2 border-dashed p-12 transition-all duration-300 cursor-pointer hover:border-music-primary",
          isDragOver ? "border-music-primary bg-music-primary/5" : "border-border"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('audio-upload')?.click()}
      >
        <div className="space-y-4">
          <ArrowUp className="w-12 h-12 text-muted-foreground mx-auto" />
          <div>
            <p className="text-lg font-medium text-foreground">
              Drag & drop your audio file
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Supports MP3, WAV, M4A, and other audio formats
            </p>
          </div>
          <Button variant="secondary" size="lg" className="mx-auto">
            Choose File
          </Button>
        </div>
      </Card>

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