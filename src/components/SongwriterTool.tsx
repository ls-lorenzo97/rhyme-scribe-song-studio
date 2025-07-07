import { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { AudioUpload } from './AudioUpload';
import { AudioControls } from './AudioControls';
import { Timeline } from './Timeline';
import { LyricsEditor } from './LyricsEditor';
import { SectionManager } from './SectionManager';
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Songwriter Studio
              </h1>
              <p className="text-muted-foreground mt-1">
                Create, edit, and organize your lyrics with AI-powered rhyme detection
              </p>
            </div>
            <ExportDialog sections={sections} audioFile={audioFile} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Audio Upload */}
        {!audioFile && (
          <Card className="p-8 bg-gradient-card shadow-card">
            <AudioUpload onFileUpload={handleFileUpload} />
          </Card>
        )}

        {/* Main Interface */}
        {audioFile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Audio Controls & Timeline */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 bg-gradient-card shadow-card">
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
                />
              </Card>

              <Card className="p-6 bg-gradient-card shadow-card">
                <Timeline
                  sections={sections}
                  currentTime={currentTime}
                  duration={duration}
                  currentSection={currentSection}
                  onSectionClick={jumpToSection}
                />
              </Card>

              <Card className="p-6 bg-gradient-card shadow-card">
                <SectionManager
                  sections={sections}
                  onSectionsUpdate={handleSectionUpdate}
                  currentSection={currentSection}
                  setCurrentSection={setCurrentSection}
                />
              </Card>
            </div>

            {/* Right Column - Lyrics Editor */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-gradient-card shadow-card h-fit sticky top-8">
                <LyricsEditor
                  section={currentSectionData}
                  onLyricsUpdate={handleLyricsUpdate}
                />
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};