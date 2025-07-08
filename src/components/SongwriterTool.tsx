import { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { AudioUpload } from './AudioUpload';
import { UnifiedTimeline } from './UnifiedTimeline';
import { AILyricsAssistant } from './lyrics/AILyricsAssistant';
import { ExportDialog } from './ExportDialog';
import { SongMetadata } from './SongMetadata';
import { LanguageSelector } from './LanguageSelector';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { LyricsEditor } from './LyricsEditor';
import { RhymeGroup } from './lyrics/AILyricsAssistant';

export interface SongSection {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  lyrics: string;
}

interface SongData {
  metadata: {
    title: string;
    artist: string;
    composer: string;
    key: string;
  };
  sections: SongSection[];
  selectedLanguage: string;
  currentSection: string | null;
}

export const SongwriterTool = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [rhymeGroups, setRhymeGroups] = useState<RhymeGroup[]>([]);

  // Persistent data using localStorage
  const [songData, setSongData] = useLocalStorage<SongData>('songwriter-data', {
    metadata: {
      title: '',
      artist: '',
      composer: '',
      key: ''
    },
    sections: [],
    selectedLanguage: 'en',
    currentSection: null
  });

  // Extract state from songData for easier access
  const { metadata, sections, selectedLanguage, currentSection } = songData;

  const handleFileUpload = useCallback((file: File) => {
    console.log('Starting file upload:', file.name, file.size);
    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    console.log('Audio URL created:', url);
    
    // Create default sections only if none exist
    if (sections.length === 0) {
      const defaultSections: SongSection[] = [
        { id: '1', name: 'Intro', startTime: 0, endTime: 15, lyrics: '' },
        { id: '2', name: 'Verse 1', startTime: 15, endTime: 45, lyrics: '' },
        { id: '3', name: 'Chorus', startTime: 45, endTime: 75, lyrics: '' },
        { id: '4', name: 'Verse 2', startTime: 75, endTime: 105, lyrics: '' },
        { id: '5', name: 'Chorus', startTime: 105, endTime: 135, lyrics: '' },
        { id: '6', name: 'Bridge', startTime: 135, endTime: 165, lyrics: '' },
        { id: '7', name: 'Outro', startTime: 165, endTime: 195, lyrics: '' },
      ];
      setSongData(prev => ({
        ...prev,
        sections: defaultSections,
        currentSection: defaultSections[0].id
      }));
    }
    console.log('File upload completed, sections created');
  }, [sections.length, setSongData]);

  const handleSectionUpdate = useCallback((updatedSections: SongSection[]) => {
    setSongData(prev => ({ ...prev, sections: updatedSections }));
  }, [setSongData]);

  const handleLyricsUpdate = useCallback((sectionId: string, lyrics: string) => {
    setSongData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? { ...section, lyrics } : section
      )
    }));
  }, [setSongData]);

  const handleMetadataUpdate = useCallback((newMetadata: typeof metadata) => {
    setSongData(prev => ({ ...prev, metadata: newMetadata }));
  }, [setSongData]);

  const handleLanguageChange = useCallback((language: string) => {
    setSongData(prev => ({ ...prev, selectedLanguage: language }));
  }, [setSongData]);

  const handleCurrentSectionChange = useCallback((sectionId: string | null) => {
    setSongData(prev => ({ ...prev, currentSection: sectionId }));
  }, [setSongData]);

  const jumpToSection = useCallback((sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section && audioRef.current) {
      audioRef.current.currentTime = section.startTime;
      handleCurrentSectionChange(sectionId);
    }
  }, [sections, handleCurrentSectionChange]);

  const currentSectionData = sections.find(s => s.id === currentSection);

  return (
    <div className="min-h-screen bg-gradient-primary">
      {/* Apple Music-style Header */}
      <div className="bg-card/80 backdrop-blur-xl border-b border-border/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">
                Music
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Songwriter Studio
              </p>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector 
                selectedLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
              />
              <ExportDialog sections={sections} audioFile={audioFile} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Audio Upload */}
        {!audioFile && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-lg w-full bg-card/80 backdrop-blur-xl border-0 shadow-large">
              <div className="p-12">
                <AudioUpload onFileUpload={handleFileUpload} />
              </div>
            </Card>
          </div>
        )}

        {/* Song Metadata */}
        {audioFile && (
          <SongMetadata
            metadata={metadata}
            onMetadataUpdate={handleMetadataUpdate}
          />
        )}

        {/* Main Interface */}
        {audioFile && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Unified Timeline with Player */}
            <div>
              <Card className="bg-card/80 backdrop-blur-xl border-0 shadow-card">
                <div className="p-6">
                  <UnifiedTimeline
                    sections={sections}
                    currentTime={currentTime}
                    duration={duration}
                    currentSection={currentSection}
                    onSectionClick={jumpToSection}
                    onSectionsUpdate={handleSectionUpdate}
                    setCurrentSection={handleCurrentSectionChange}
                    audioRef={audioRef}
                    audioUrl={audioUrl}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    setCurrentTime={setCurrentTime}
                    setDuration={setDuration}
                    audioFile={audioFile}
                  />
                </div>
              </Card>
            </div>

            {/* Right Column - Lyrics Editor */}
            <div>
              <Card className="bg-card/80 backdrop-blur-xl border-0 shadow-card sticky top-24">
                <div className="p-6">
                  <LyricsEditor
                    section={currentSectionData}
                    onLyricsUpdate={handleLyricsUpdate}
                    selectedLanguage={selectedLanguage}
                    rhymeGroups={rhymeGroups}
                    setRhymeGroups={setRhymeGroups}
                  />
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};