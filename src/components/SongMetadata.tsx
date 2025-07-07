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
}

const musicalKeys = [
  'C major', 'C# major', 'D major', 'D# major', 'E major', 'F major',
  'F# major', 'G major', 'G# major', 'A major', 'A# major', 'B major',
  'C minor', 'C# minor', 'D minor', 'D# minor', 'E minor', 'F minor',
  'F# minor', 'G minor', 'G# minor', 'A minor', 'A# minor', 'B minor'
];

export const SongMetadata = ({ metadata, onMetadataUpdate }: SongMetadataProps) => {
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
            Song Title
          </Label>
          <Input
            id="song-title"
            value={metadata.title}
            onChange={(e) => handleUpdate('title', e.target.value)}
            placeholder="Enter song title..."
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="artist" className="text-sm font-medium">
            Artist
          </Label>
          <Input
            id="artist"
            value={metadata.artist}
            onChange={(e) => handleUpdate('artist', e.target.value)}
            placeholder="Enter artist name..."
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="composer" className="text-sm font-medium">
            Composer
          </Label>
          <Input
            id="composer"
            value={metadata.composer}
            onChange={(e) => handleUpdate('composer', e.target.value)}
            placeholder="Enter composer name..."
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="key" className="text-sm font-medium">
            Key
          </Label>
          <Select value={metadata.key} onValueChange={(value) => handleUpdate('key', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select key..." />
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