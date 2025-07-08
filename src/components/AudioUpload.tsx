import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, Music } from 'lucide-react';
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
    const allowedFormats = ['audio/mp3', 'audio/mpeg', 'audio/aac', 'audio/wav', 'audio/flac', 'audio/ogg'];
    const audioFile = files.find(file => allowedFormats.includes(file.type));
    
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
        <div className="w-16 h-16 bg-gradient-music rounded-2xl flex items-center justify-center shadow-card">
          <Music className="w-8 h-8 text-white" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Choose Your Song
        </h3>
        <p className="text-muted-foreground text-sm">
          Drag and drop or click to browse your music files
        </p>
      </div>

      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer",
          "hover:bg-muted/30 hover:border-music-accent",
          isDragOver ? "border-music-accent bg-music-accent/10 scale-[1.02]" : "border-border/40"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('audio-upload')?.click()}
      >
        <div className="space-y-4">
          <ArrowUp className="w-10 h-10 text-muted-foreground mx-auto" />
          <div>
            <p className="text-base font-medium text-foreground mb-1">
              Drop your audio file here
            </p>
            <p className="text-xs text-muted-foreground">
              MP3, AAC, WAV, FLAC, OGG
            </p>
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="bg-music-primary hover:bg-music-primary/90 text-white rounded-lg px-6 py-2 font-medium"
          >
            Browse Files
          </Button>
        </div>
      </div>

      <input
        id="audio-upload"
        type="file"
        accept=".mp3,.aac,.wav,.flac,.ogg,audio/mp3,audio/mpeg,audio/aac,audio/wav,audio/flac,audio/ogg"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};