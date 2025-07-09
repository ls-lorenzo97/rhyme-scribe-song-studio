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
import { Upload, Music, Clock, Edit3, Eye, History } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Map country codes to language codes
const countryToLanguage: Record<string, string> = {
  IT: 'it',
  US: 'en',
  GB: 'en',
  FR: 'fr',
  DE: 'de',
  ES: 'es',
  // Add more mappings as needed
};

// Comprehensive translation dictionary for all 5 languages
const translations: Record<string, Record<string, string>> = {
  en: {
    music: 'Music',
    songwriterStudio: 'Songwriter Studio',
    uploadYourSong: 'Upload Your Song',
    changeFile: 'Change File',
    songInformation: 'Song Information',
    uploadToUnlockInfo: 'Upload a song to unlock song information',
    songTimeline: 'Song Timeline',
    uploadToCreateTimeline: 'Upload a song to create timeline sections',
    writeLyrics: 'Write Lyrics',
    editLyrics: 'Edit Lyrics',
    preview: 'Preview',
    uploadToWriteLyrics: 'Upload a song to start writing lyrics',
    openLastSession: 'Open Last Session',
    sessionRestored: 'Session Restored',
    sessionRestoredDesc: 'Your last session has been loaded.',
    noSessionFound: 'No Session Found',
    noSessionFoundDesc: 'No previous session was found in your browser.',
    error: 'Error',
    errorRestore: 'Could not restore the last session.',
    sessionRestoredAudioMissing: 'Session restored, but audio file needs to be re-uploaded.',
    sessionRestoredAudioMissingDesc: 'Please upload the same audio file to continue working.',
    suggestedFileName: 'Suggested File Name'
  },
  it: {
    music: 'Musica',
    songwriterStudio: 'Studio Cantautore',
    uploadYourSong: 'Carica la tua canzone',
    changeFile: 'Cambia File',
    songInformation: 'Informazioni Canzone',
    uploadToUnlockInfo: 'Carica una canzone per sbloccare le informazioni',
    songTimeline: 'Timeline Canzone',
    uploadToCreateTimeline: 'Carica una canzone per creare le sezioni',
    writeLyrics: 'Scrivi Testo',
    editLyrics: 'Modifica Testo',
    preview: 'Anteprima',
    uploadToWriteLyrics: 'Carica una canzone per iniziare a scrivere il testo',
    openLastSession: 'Apri Ultima Sessione',
    sessionRestored: 'Sessione Ripristinata',
    sessionRestoredDesc: 'La tua ultima sessione è stata caricata.',
    noSessionFound: 'Nessuna Sessione',
    noSessionFoundDesc: 'Nessuna sessione precedente trovata nel browser.',
    error: 'Errore',
    errorRestore: 'Impossibile ripristinare la sessione.',
    sessionRestoredAudioMissing: 'Sessione ripristinata, ma il file audio deve essere ricaricato.',
    sessionRestoredAudioMissingDesc: 'Carica lo stesso file audio per continuare a lavorare.',
    suggestedFileName: 'Nome File Suggerito'
  },
  es: {
    music: 'Música',
    songwriterStudio: 'Estudio de Composición',
    uploadYourSong: 'Sube tu Canción',
    changeFile: 'Cambiar Archivo',
    songInformation: 'Información de la Canción',
    uploadToUnlockInfo: 'Sube una canción para desbloquear la información',
    songTimeline: 'Línea de Tiempo',
    uploadToCreateTimeline: 'Sube una canción para crear secciones',
    writeLyrics: 'Escribir Letra',
    editLyrics: 'Editar Letra',
    preview: 'Vista Previa',
    uploadToWriteLyrics: 'Sube una canción para empezar a escribir la letra',
    openLastSession: 'Abrir Última Sesión',
    sessionRestored: 'Sesión Restaurada',
    sessionRestoredDesc: 'Tu última sesión ha sido cargada.',
    noSessionFound: 'No se Encontró Sesión',
    noSessionFoundDesc: 'No se encontró ninguna sesión anterior en tu navegador.',
    error: 'Error',
    errorRestore: 'No se pudo restaurar la sesión.',
    sessionRestoredAudioMissing: 'Sesión restaurada, pero el archivo de audio debe ser subido de nuevo.',
    sessionRestoredAudioMissingDesc: 'Sube el mismo archivo de audio para continuar trabajando.',
    suggestedFileName: 'Nombre de Archivo Sugerido'
  },
  fr: {
    music: 'Musique',
    songwriterStudio: 'Studio de Composition',
    uploadYourSong: 'Télécharger votre Chanson',
    changeFile: 'Changer de Fichier',
    songInformation: 'Informations de la Chanson',
    uploadToUnlockInfo: 'Téléchargez une chanson pour débloquer les informations',
    songTimeline: 'Chronologie de la Chanson',
    uploadToCreateTimeline: 'Téléchargez une chanson pour créer des sections',
    writeLyrics: 'Écrire les Paroles',
    editLyrics: 'Modifier les Paroles',
    preview: 'Aperçu',
    uploadToWriteLyrics: 'Téléchargez une chanson pour commencer à écrire les paroles',
    openLastSession: 'Ouvrir la Dernière Session',
    sessionRestored: 'Session Restaurée',
    sessionRestoredDesc: 'Votre dernière session a été chargée.',
    noSessionFound: 'Aucune Session Trouvée',
    noSessionFoundDesc: 'Aucune session précédente trouvée dans votre navigateur.',
    error: 'Erreur',
    errorRestore: 'Impossible de restaurer la session.',
    sessionRestoredAudioMissing: 'Session restaurée, mais le fichier audio doit être retéléchargé.',
    sessionRestoredAudioMissingDesc: 'Téléchargez le même fichier audio pour continuer à travailler.',
    suggestedFileName: 'Nom de Fichier Suggeré'
  },
  de: {
    music: 'Musik',
    songwriterStudio: 'Songwriter Studio',
    uploadYourSong: 'Lied hochladen',
    changeFile: 'Datei ändern',
    songInformation: 'Liedinformationen',
    uploadToUnlockInfo: 'Laden Sie ein Lied hoch, um Informationen freizuschalten',
    songTimeline: 'Lied-Timeline',
    uploadToCreateTimeline: 'Laden Sie ein Lied hoch, um Abschnitte zu erstellen',
    writeLyrics: 'Text schreiben',
    editLyrics: 'Text bearbeiten',
    preview: 'Vorschau',
    uploadToWriteLyrics: 'Laden Sie ein Lied hoch, um mit dem Schreiben des Textes zu beginnen',
    openLastSession: 'Letzte Sitzung öffnen',
    sessionRestored: 'Sitzung wiederhergestellt',
    sessionRestoredDesc: 'Ihre letzte Sitzung wurde geladen.',
    noSessionFound: 'Keine Sitzung gefunden',
    noSessionFoundDesc: 'Keine vorherige Sitzung in Ihrem Browser gefunden.',
    error: 'Fehler',
    errorRestore: 'Sitzung konnte nicht wiederhergestellt werden.',
    sessionRestoredAudioMissing: 'Sitzung wiederhergestellt, aber Audiodatei muss erneut hochgeladen werden.',
    sessionRestoredAudioMissingDesc: 'Laden Sie dieselbe Audiodatei hoch, um weiterzuarbeiten.',
    suggestedFileName: 'Vorgeschlagener Dateiname'
  }
};

function t(lang: string, key: string): string {
  return translations[lang]?.[key] || translations['en'][key] || key;
}

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
  audioFileName?: string; // Store filename for session restore
}

export const SongwriterTool = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [rhymeGroups, setRhymeGroups] = useState<RhymeGroup[]>([]);
  const [lyricsPreview, setLyricsPreview] = useState<{ lines: string[]; rhymeGroups: RhymeGroup[] }>({ lines: [], rhymeGroups: [] });
  const [showPreviewSidebar, setShowPreviewSidebar] = useState(false);

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

  // Default language detection on first load
  useEffect(() => {
    // Only run if no language is set in localStorage
    const localLang = localStorage.getItem('songwriter-language');
    if (!localLang) {
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          const country = data.country_code;
          const lang = countryToLanguage[country] || 'en';
          setSongData(prev => ({ ...prev, selectedLanguage: lang }));
          localStorage.setItem('songwriter-language', lang);
        })
        .catch(() => {
          setSongData(prev => ({ ...prev, selectedLanguage: 'en' }));
          localStorage.setItem('songwriter-language', 'en');
        });
    } else {
      setSongData(prev => ({ ...prev, selectedLanguage: localLang }));
    }
  }, [setSongData]);

  // When user changes language, persist it
  const handleLanguageChange = useCallback((language: string) => {
    setSongData(prev => ({ ...prev, selectedLanguage: language }));
    localStorage.setItem('songwriter-language', language);
  }, [setSongData]);

  const handleFileUpload = useCallback((file: File) => {
    console.log('Starting file upload:', file.name, file.size);
    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    console.log('Audio URL created:', url);
    
    // Save filename to session data
    setSongData(prev => ({ ...prev, audioFileName: file.name }));
    
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

  // Restore last session handler
  const handleRestoreLastSession = () => {
    try {
      const lastSession = localStorage.getItem('songwriter-data');
      if (lastSession) {
        const sessionData = JSON.parse(lastSession);
        setSongData(sessionData);
        
        // Check if we have audio filename but no audio file
        if (sessionData.audioFileName && !audioFile) {
          toast({
            title: t(selectedLanguage, 'sessionRestoredAudioMissing'),
            description: `${t(selectedLanguage, 'sessionRestoredAudioMissingDesc')} ${t(selectedLanguage, 'suggestedFileName')}: "${sessionData.audioFileName}"`,
          });
        } else {
          toast({
            title: t(selectedLanguage, 'sessionRestored'),
            description: t(selectedLanguage, 'sessionRestoredDesc'),
          });
        }
      } else {
        toast({
          title: t(selectedLanguage, 'noSessionFound'),
          description: t(selectedLanguage, 'noSessionFoundDesc'),
        });
      }
    } catch (e) {
      toast({
        title: t(selectedLanguage, 'error'),
        description: t(selectedLanguage, 'errorRestore'),
      });
    }
  };

  // Handle file change - open file picker directly
  const handleFileChange = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mp3,.aac,.wav,.flac,.ogg,audio/mp3,audio/mpeg,audio/aac,audio/wav,audio/flac,audio/ogg';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    };
    input.click();
  };

  // --- Automatic section sync with audio playback ---
  useEffect(() => {
    if (!sections.length) return;
    // Find the section that contains the current time
    const activeSection = sections.find(
      (section) =>
        currentTime >= section.startTime && currentTime < section.endTime
    );
    if (activeSection && currentSection !== activeSection.id) {
      setSongData((prev) => ({ ...prev, currentSection: activeSection.id }));
    }
    // If audio is before the first section, clear selection
    if (!activeSection && currentSection !== null) {
      setSongData((prev) => ({ ...prev, currentSection: null }));
    }
  }, [currentTime, sections, currentSection, setSongData]);

  return (
    <div className="min-h-screen bg-gradient-primary" data-name="songwriter-root">
      {/* Apple Music-style Header */}
      <div className="bg-card/80 backdrop-blur-xl border-b border-border/20 sticky top-0 z-50" data-name="main-header">
        <div className="max-w-7xl mx-auto px-6 py-4" data-name="main-header-inner">
          <div className="flex items-center justify-between" data-name="main-header-row">
            <div data-name="main-header-title-group">
              <h1 className="text-3xl font-semibold text-foreground">
                {t(selectedLanguage, 'music')}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {t(selectedLanguage, 'songwriterStudio')}
              </p>
            </div>
            <div className="flex items-center gap-4" data-name="main-header-actions">
              <LanguageSelector 
                selectedLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
              />
              <ExportDialog sections={sections} audioFile={audioFile} selectedLanguage={selectedLanguage} />
              {/* Open Last Session Button */}
              <button
                onClick={handleRestoreLastSession}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-foreground text-sm font-medium shadow-sm"
                title={t(selectedLanguage, 'openLastSession')}
                data-name="open-last-session-btn"
              >
                <History className="w-4 h-4" />
                {t(selectedLanguage, 'openLastSession')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8" data-name="songwriter-content">
        {/* Step 1: Audio Upload - Always Visible */}
        <div className="space-y-4" data-name="audio-upload-section">
          <div className="flex items-center gap-3" data-name="audio-upload-header">
            <div className="w-8 h-8 bg-music-primary rounded-full flex items-center justify-center text-white font-semibold text-sm" data-name="audio-upload-step">1</div>
            <div className="flex items-center gap-2" data-name="audio-upload-title">
              <Upload className="w-5 h-5 text-music-primary" />
              <h2 className="text-xl font-semibold text-foreground">{t(selectedLanguage, 'uploadYourSong')}</h2>
            </div>
          </div>
          
          <Card className="bg-card/80 backdrop-blur-xl border-0 shadow-card" data-name="audio-upload-card">
            <div className="p-6" data-name="audio-upload-card-inner">
              {!audioFile ? (
                <AudioUpload onFileUpload={handleFileUpload} selectedLanguage={selectedLanguage} />
              ) : (
                <div className="flex items-center justify-between" data-name="audio-upload-file-row">
                  <div className="flex items-center gap-4" data-name="audio-upload-file-info">
                    <div className="w-12 h-12 bg-music-primary/20 rounded-xl flex items-center justify-center" data-name="audio-upload-file-icon">
                      <Music className="w-6 h-6 text-music-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{audioFile.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {(audioFile.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleFileChange}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-name="audio-upload-change-btn"
                  >
                    {t(selectedLanguage, 'changeFile')}
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Step 2: Song Metadata */}
        <div className={`space-y-4 transition-opacity duration-300 ${!audioFile ? 'opacity-50 pointer-events-none' : ''}`} data-name="song-metadata-section">
          <div className="flex items-center gap-3" data-name="song-metadata-header">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
              audioFile ? 'bg-music-primary text-white' : 'bg-muted text-muted-foreground'
            }`} data-name="song-metadata-step">2</div>
            <div className="flex items-center gap-2" data-name="song-metadata-title">
              <Music className={`w-5 h-5 ${audioFile ? 'text-music-primary' : 'text-muted-foreground'}`} />
              <h2 className="text-xl font-semibold text-foreground">{t(selectedLanguage, 'songInformation')}</h2>
            </div>
          </div>
          
          <Card className="bg-card/80 backdrop-blur-xl border-0 shadow-card" data-name="song-metadata-card">
            <div className="p-6" data-name="song-metadata-card-inner">
              {audioFile ? (
                <SongMetadata
                  metadata={metadata}
                  onMetadataUpdate={handleMetadataUpdate}
                  selectedLanguage={selectedLanguage}
                />
              ) : (
                <div className="text-center py-8" data-name="song-metadata-locked">
                  <p className="text-muted-foreground">{t(selectedLanguage, 'uploadToUnlockInfo')}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Main Flex Layout for Editor + Sidebar */}
        <div className="flex flex-row gap-6 relative" data-name="editor-layout-row">
          {/* Main Editor Area */}
          <div className="flex-1 min-w-0" data-name="editor-main-area">
            {/* --- v0.dev Apple Music UI will be inserted here --- */}
            <div className="w-full min-h-[600px] bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col" data-name="editor-main-card">
              {/* Header */}
              <div className="flex items-center justify-between mb-6" data-name="editor-main-header">
                <div className="flex items-center gap-3" data-name="editor-main-header-left">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center" data-name="editor-main-header-icon">
                    <div className="w-3 h-3 bg-white rounded-sm"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Song Production</h3>
                    <p className="text-xs text-gray-500">
                      {duration ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : '0:00'} • {sections.length} sections
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono text-lg font-medium text-gray-900">
                      {currentTime ? `${Math.floor(currentTime / 60)}:${(Math.floor(currentTime) % 60).toString().padStart(2, '0')}` : '0:00'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = 0; setCurrentTime(0); }} className="h-8 w-8 hover:bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 20l-7-8 7-8" /></svg>
                    </button>
                    <button onClick={() => { if (audioRef.current) { isPlaying ? audioRef.current.pause() : audioRef.current.play(); setIsPlaying(!isPlaying); } }} className={`h-9 w-9 rounded-full flex items-center justify-center ${isPlaying ? 'bg-gray-900 hover:bg-gray-800' : 'bg-blue-500 hover:bg-blue-600'}`}> {isPlaying ? (<svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>) : (<svg className="h-4 w-4 text-white ml-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21 5,3" /></svg>)} </button>
                    <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = duration; setCurrentTime(duration); }} className="h-8 w-8 hover:bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 4l7 8-7 8" /></svg>
                    </button>
                  </div>
                </div>
              </div>
              {/* Timeline/Sections */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-700">Song Sections</h4>
                  <button onClick={() => handleSectionUpdate([...sections, { id: Date.now().toString(), name: 'New Section', startTime: duration, endTime: duration + 30, lyrics: '' }])} className="h-7 text-xs bg-transparent border border-gray-300 rounded px-3 py-1 flex items-center gap-1 hover:bg-gray-100">
                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Add Section
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  {sections.map((section, index) => (
                    <div key={section.id} className="bg-gray-50 border border-gray-200 rounded-xl shadow-sm p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded font-bold text-white" style={{ background: '#3B82F6' }}>{section.name}</span>
                        <span className="text-xs text-gray-500">{`${Math.floor(section.startTime / 60)}:${(section.startTime % 60).toString().padStart(2, '0')} - ${Math.floor(section.endTime / 60)}:${(section.endTime % 60).toString().padStart(2, '0')}`}</span>
                      </div>
                      {/* Lyrics lines */}
                      {section.lyrics ? (
                        section.lyrics.split('\n').map((line, idx) => (
                          <div key={idx} className="mb-1">
                            <input value={line} className="w-full border rounded px-2 py-1" readOnly />
                          </div>
                        ))
                      ) : (
                        <button className="text-blue-600 text-sm">Add first line</button>
                      )}
                      <button className="mt-2 text-blue-600 text-xs">Add line to {section.name}</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Button to open sidebar */}
            {!showPreviewSidebar && (
              <button
                className="fixed right-8 bottom-8 z-40 bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700 transition"
                onClick={() => setShowPreviewSidebar(true)}
              >
                Show Preview
              </button>
            )}
          </div>

          {/* Sidebar for Full Song Preview */}
          {showPreviewSidebar && (
            <div className="w-[350px] bg-white border-l border-gray-200 shadow-xl fixed right-0 top-0 h-full z-50 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Full Song Preview</h3>
                <button
                  className="text-gray-500 hover:text-gray-800"
                  onClick={() => setShowPreviewSidebar(false)}
                  aria-label="Close Preview"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <LyricsPreview lines={sections.flatMap(s => s.lyrics ? s.lyrics.split('\n') : [])} rhymeGroups={rhymeGroups} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente LyricsPreview
const LyricsPreview = ({ lines, rhymeGroups }: { lines: string[]; rhymeGroups: RhymeGroup[] }) => {
  // Funzione per trovare colore e lettera della rima per una riga
  const getRhymeColor = (lineIdx: number) => {
    const group = rhymeGroups.find(g => g.positions.some(pos => pos.line === lineIdx));
    return group ? group.color : undefined;
  };
  return (
    <div className="space-y-1">
      {lines.map((line, idx) => {
        if (!line) return <div key={idx}>&nbsp;</div>;
        const words = line.split(/(\s+)/);
        // Trova l'ultima parola
        let lastWordIdx = -1;
        for (let i = words.length - 1; i >= 0; i--) {
          if (words[i].trim() && !/\s+/.test(words[i])) {
            lastWordIdx = i;
            break;
          }
        }
        const color = getRhymeColor(idx);
        return (
          <div key={idx} className="text-base">
            {words.map((w, i) => {
              if (i === lastWordIdx && color) {
                return <span key={i} style={{ color, fontWeight: 600 }}>{w}</span>;
              }
              return <span key={i}>{w}</span>;
            })}
          </div>
        );
      })}
    </div>
  );
};