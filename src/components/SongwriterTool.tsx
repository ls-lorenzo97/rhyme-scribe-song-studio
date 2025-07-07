import { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { AudioUpload } from './AudioUpload';
import { AudioControls } from './AudioControls';
import { UnifiedTimeline } from './UnifiedTimeline';
import { LyricsEditor } from './LyricsEditor';
import { ExportDialog } from './ExportDialog';

export interface SongSection {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  lyrics: string;
}

export const SongwriterTool = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [sections, setSections] = useState<SongSection[]>([]);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleFileUpload = useCallback((file: File) => {
    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    
    // Create default sections
    const defaultSections: SongSection[] = [
      { id: '1', name: 'Intro', startTime: 0, endTime: 15, lyrics: '' },
      { id: '2', name: 'Verse 1', startTime: 15, endTime: 45, lyrics: '' },
      { id: '3', name: 'Chorus', startTime: 45, endTime: 75, lyrics: '' },
      { id: '4', name: 'Verse 2', startTime: 75, endTime: 105, lyrics: '' },
      { id: '5', name: 'Chorus', startTime: 105, endTime: 135, lyrics: '' },
      { id: '6', name: 'Bridge', startTime: 135, endTime: 165, lyrics: '' },
      { id: '7', name: 'Outro', startTime: 165, endTime: 195, lyrics: '' },
    ];
    setSections(defaultSections);
    setCurrentSection(defaultSections[0].id);
  }, []);

  const handleSectionUpdate = useCallback((updatedSections: SongSection[]) => {
    setSections(updatedSections);
  }, []);

  const handleLyricsUpdate = useCallback((sectionId: string, lyrics: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId ? { ...section, lyrics } : section
    ));
  }, []);

  const jumpToSection = useCallback((sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section && audioRef.current) {
      audioRef.current.currentTime = section.startTime;
      setCurrentSection(sectionId);
    }
  }, [sections]);

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
            <ExportDialog sections={sections} audioFile={audioFile} />
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

        {/* Main Interface */}
        {audioFile && (
          <div className="space-y-6">
            {/* Now Playing Section */}
            <Card className="bg-card/80 backdrop-blur-xl border-0 shadow-card">
              <div className="p-8">
                <AudioControls
                  audioRef={audioRef}
                  audioUrl={audioUrl}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  currentTime={currentTime}
                  setCurrentTime={setCurrentTime}
                  duration={duration}
                  setDuration={setDuration}
                  currentSection={currentSection}
                  sections={sections}
                  audioFile={audioFile}
                />
              </div>
            </Card>

            {/* Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left Column - Unified Timeline */}
              <div className="xl:col-span-2">
                <Card className="bg-card/80 backdrop-blur-xl border-0 shadow-card">
                  <div className="p-6">
                    <UnifiedTimeline
                      sections={sections}
                      currentTime={currentTime}
                      duration={duration}
                      currentSection={currentSection}
                      onSectionClick={jumpToSection}
                      onSectionsUpdate={handleSectionUpdate}
                      setCurrentSection={setCurrentSection}
                    />
                  </div>
                </Card>
              </div>

              {/* Right Column - Lyrics Editor */}
              <div className="xl:col-span-1">
                <Card className="bg-card/80 backdrop-blur-xl border-0 shadow-card sticky top-24">
                  <div className="p-6">
                    <LyricsEditor
                      section={currentSectionData}
                      onLyricsUpdate={handleLyricsUpdate}
                    />
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};