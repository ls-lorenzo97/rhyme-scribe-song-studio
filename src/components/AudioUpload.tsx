import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Music, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioUploadProps {
  onFileUpload: (file: File) => void;
  selectedLanguage?: string;
}

// Translation dictionary for AudioUpload
const translations: Record<string, Record<string, string>> = {
  en: {
    chooseYourSong: 'Choose Your Song',
    dragDropBrowse: 'Drag and drop or click to browse your music files',
    dropAudioFile: 'Drop your audio file here',
    supportedFormats: 'MP3, AAC, WAV, FLAC, OGG',
    browseFiles: 'Browse Files'
  },
  it: {
    chooseYourSong: 'Scegli la tua Canzone',
    dragDropBrowse: 'Trascina e rilascia o clicca per sfogliare i file musicali',
    dropAudioFile: 'Rilascia qui il tuo file audio',
    supportedFormats: 'MP3, AAC, WAV, FLAC, OGG',
    browseFiles: 'Sfoglia File'
  },
  es: {
    chooseYourSong: 'Elige tu Canción',
    dragDropBrowse: 'Arrastra y suelta o haz clic para explorar tus archivos de música',
    dropAudioFile: 'Suelta tu archivo de audio aquí',
    supportedFormats: 'MP3, AAC, WAV, FLAC, OGG',
    browseFiles: 'Explorar Archivos'
  },
  fr: {
    chooseYourSong: 'Choisissez votre Chanson',
    dragDropBrowse: 'Glissez-déposez ou cliquez pour parcourir vos fichiers musicaux',
    dropAudioFile: 'Déposez votre fichier audio ici',
    supportedFormats: 'MP3, AAC, WAV, FLAC, OGG',
    browseFiles: 'Parcourir les Fichiers'
  },
  de: {
    chooseYourSong: 'Wählen Sie Ihr Lied',
    dragDropBrowse: 'Ziehen und ablegen oder klicken Sie, um Ihre Musikdateien zu durchsuchen',
    dropAudioFile: 'Legen Sie hier Ihre Audiodatei ab',
    supportedFormats: 'MP3, AAC, WAV, FLAC, OGG',
    browseFiles: 'Dateien Durchsuchen'
  }
};

function t(lang: string, key: string): string {
  return translations[lang]?.[key] || translations['en'][key] || key;
}

export const AudioUpload = ({ onFileUpload, selectedLanguage = 'en' }: AudioUploadProps) => {
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
    const audioFile = files.find(file => 
      file.type.startsWith('audio/') || 
      /\.(mp3|aac|wav|flac|ogg)$/i.test(file.name)
    );
    
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
    <div className="text-center space-y-6" data-name="audio-upload-root">
      <div className="flex justify-center" data-name="audio-upload-icon-row">
        <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center shadow-card border" data-name="audio-upload-icon">
          <Music className="w-8 h-8 text-primary" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {t(selectedLanguage, 'chooseYourSong')}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t(selectedLanguage, 'dragDropBrowse')}
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
        data-name="audio-upload-dropzone"
      >
        <div className="space-y-4">
          <ArrowUp className="w-10 h-10 text-muted-foreground mx-auto" />
          <div>
            <p className="text-base font-medium text-foreground mb-1">
              {t(selectedLanguage, 'dropAudioFile')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(selectedLanguage, 'supportedFormats')}
            </p>
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="bg-music-primary hover:bg-music-primary/90 text-white rounded-lg px-6 py-2 font-medium"
            data-name="audio-upload-btn"
          >
            {t(selectedLanguage, 'browseFiles')}
          </Button>
        </div>
      </div>

      <input
        id="audio-upload"
        type="file"
        accept=".mp3,.aac,.wav,.flac,.ogg,audio/mp3,audio/mpeg,audio/aac,audio/wav,audio/flac,audio/ogg"
        onChange={handleFileSelect}
        className="hidden"
        data-name="audio-upload-input"
      />
    </div>
  );
};