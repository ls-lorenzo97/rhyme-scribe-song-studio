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
    <Card className="p-4 mb-6 bg-card text-foreground border" data-name="song-metadata-root">
      <form className="space-y-4" data-name="song-metadata-form">
        <div className="flex flex-col gap-2" data-name="song-metadata-field-title">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={metadata.title} onChange={e => onMetadataUpdate({ ...metadata, title: e.target.value })} />
        </div>
        <div className="flex flex-col gap-2" data-name="song-metadata-field-artist">
          <Label htmlFor="artist">Artist</Label>
          <Input id="artist" value={metadata.artist} onChange={e => onMetadataUpdate({ ...metadata, artist: e.target.value })} />
        </div>
        <div className="flex flex-col gap-2" data-name="song-metadata-field-composer">
          <Label htmlFor="composer">Composer</Label>
          <Input id="composer" value={metadata.composer} onChange={e => onMetadataUpdate({ ...metadata, composer: e.target.value })} />
        </div>
        <div className="flex flex-col gap-2" data-name="song-metadata-field-key">
          <Label htmlFor="key">Key</Label>
          <Input id="key" value={metadata.key} onChange={e => onMetadataUpdate({ ...metadata, key: e.target.value })} />
        </div>
      </form>
    </Card>
  );
};