import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface SongMetadata {
  title: string;
  artist: string;
  composer: string;
  key: string;
}

interface SongMetadataProps {
  metadata: SongMetadata;
  onMetadataUpdate: (metadata: SongMetadata) => void;
  selectedLanguage?: string;
}

// Translation dictionary for SongMetadata
const translations: Record<string, Record<string, string>> = {
  en: {
    songTitle: 'Song Title',
    enterSongTitle: 'Enter song title...',
    artist: 'Artist',
    enterArtistName: 'Enter artist name...',
    composer: 'Composer',
    enterComposerName: 'Enter composer name...',
    key: 'Key',
    selectKey: 'Select key...'
  },
  it: {
    songTitle: 'Titolo Canzone',
    enterSongTitle: 'Inserisci il titolo della canzone...',
    artist: 'Artista',
    enterArtistName: 'Inserisci il nome dell\'artista...',
    composer: 'Compositore',
    enterComposerName: 'Inserisci il nome del compositore...',
    key: 'Tonalità',
    selectKey: 'Seleziona tonalità...'
  },
  es: {
    songTitle: 'Título de la Canción',
    enterSongTitle: 'Ingresa el título de la canción...',
    artist: 'Artista',
    enterArtistName: 'Ingresa el nombre del artista...',
    composer: 'Compositor',
    enterComposerName: 'Ingresa el nombre del compositor...',
    key: 'Tonalidad',
    selectKey: 'Selecciona tonalidad...'
  },
  fr: {
    songTitle: 'Titre de la Chanson',
    enterSongTitle: 'Entrez le titre de la chanson...',
    artist: 'Artiste',
    enterArtistName: 'Entrez le nom de l\'artiste...',
    composer: 'Compositeur',
    enterComposerName: 'Entrez le nom du compositeur...',
    key: 'Tonalité',
    selectKey: 'Sélectionnez la tonalité...'
  },
  de: {
    songTitle: 'Liedtitel',
    enterSongTitle: 'Liedtitel eingeben...',
    artist: 'Künstler',
    enterArtistName: 'Künstlername eingeben...',
    composer: 'Komponist',
    enterComposerName: 'Komponistennamen eingeben...',
    key: 'Tonart',
    selectKey: 'Tonart auswählen...'
  }
};

function t(lang: string, key: string): string {
  return translations[lang]?.[key] || translations['en'][key] || key;
}

const musicalKeys = [
  'C major', 'C# major', 'D major', 'D# major', 'E major', 'F major',
  'F# major', 'G major', 'G# major', 'A major', 'A# major', 'B major',
  'C minor', 'C# minor', 'D minor', 'D# minor', 'E minor', 'F minor',
  'F# minor', 'G minor', 'G# minor', 'A minor', 'A# minor', 'B minor'
];

export const SongMetadata = ({ metadata, onMetadataUpdate, selectedLanguage = 'en' }: SongMetadataProps) => {
  const handleUpdate = (field: keyof SongMetadata, value: string) => {
    onMetadataUpdate({
      ...metadata,
      [field]: value
    });
  };

  return (
    <Card className="p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="song-title" className="text-sm font-medium">
            {t(selectedLanguage, 'songTitle')}
          </Label>
          <Input
            id="song-title"
            value={metadata.title}
            onChange={(e) => handleUpdate('title', e.target.value)}
            placeholder={t(selectedLanguage, 'enterSongTitle')}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="artist" className="text-sm font-medium">
            {t(selectedLanguage, 'artist')}
          </Label>
          <Input
            id="artist"
            value={metadata.artist}
            onChange={(e) => handleUpdate('artist', e.target.value)}
            placeholder={t(selectedLanguage, 'enterArtistName')}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="composer" className="text-sm font-medium">
            {t(selectedLanguage, 'composer')}
          </Label>
          <Input
            id="composer"
            value={metadata.composer}
            onChange={(e) => handleUpdate('composer', e.target.value)}
            placeholder={t(selectedLanguage, 'enterComposerName')}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="key" className="text-sm font-medium">
            {t(selectedLanguage, 'key')}
          </Label>
          <Select value={metadata.key} onValueChange={(value) => handleUpdate('key', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t(selectedLanguage, 'selectKey')} />
            </SelectTrigger>
            <SelectContent>
              {musicalKeys.map(key => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};