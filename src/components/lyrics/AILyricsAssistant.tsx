import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SongSection } from '../SongwriterTool';
import { RhymeDetector } from './RhymeDetector';
import { LanguageDetector } from './LanguageDetector';
import { analyzeRhymeScheme } from './utils';
import { Edit, Plus, Mic, Sparkles } from 'lucide-react';

interface AILyricsAssistantProps {
  section: SongSection | undefined;
  onLyricsUpdate: (sectionId: string, lyrics: string) => void;
}

// Export types for other components
export interface RhymeGroup {
  id: string;
  words: string[];
  color: string;
  type: 'perfect' | 'near' | 'internal' | 'multisyllabic' | 'eye';
  strength: number;
  positions: Array<{ 
    line: number; 
    wordIndex: number; 
    word: string; 
    startChar: number; 
    endChar: number; 
  }>;
}

export interface LyricsAnalysis {
  wordCount: number;
  lineCount: number;
  syllableCount: number;
  avgSyllablesPerLine: number;
  rhymeGroups: RhymeGroup[];
  rhymeScheme: string[];
  language: string;
  mood: string;
  complexity: number;
  readabilityScore: number;
}

interface LineData {
  id: string;
  text: string;
  syllableCount: number;
  rhymeLetter: string;
  suggestions: string[];
}

interface Language {
  code: string;
  name: string;
  syllableRules: (word: string) => number;
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', syllableRules: countEnglishSyllables },
  { code: 'it', name: 'Italian', syllableRules: countItalianSyllables },
  { code: 'es', name: 'Spanish', syllableRules: countSpanishSyllables },
  { code: 'fr', name: 'French', syllableRules: countFrenchSyllables },
  { code: 'de', name: 'German', syllableRules: countGermanSyllables },
];

export const AILyricsAssistant = ({ section, onLyricsUpdate }: AILyricsAssistantProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [lines, setLines] = useState<LineData[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [focusedLineId, setFocusedLineId] = useState<string | null>(null);
  
  const rhymeDetector = useMemo(() => new RhymeDetector(), []);
  const currentLanguage = LANGUAGES.find(lang => lang.code === selectedLanguage) || LANGUAGES[0];

  // Initialize default lines when section changes
  useEffect(() => {
    console.log('AILyricsAssistant: section changed', section?.name);
    if (section) {
      const existingLines = section.lyrics ? section.lyrics.split('\n') : [];
      const initialLines: LineData[] = [];
      
      // Create 8 default lines or use existing
      for (let i = 0; i < Math.max(8, existingLines.length); i++) {
        initialLines.push({
          id: `line-${i}`,
          text: existingLines[i] || '',
          syllableCount: 0,
          rhymeLetter: '',
          suggestions: []
        });
      }
      
      console.log('AILyricsAssistant: setting lines', initialLines.length);
      setLines(initialLines);
      
      // Only run analysis if there are actual lyrics
      if (initialLines.some(line => line.text.trim())) {
        console.log('AILyricsAssistant: starting analysis');
        updateAnalysis(initialLines);
      }
    }
  }, [section?.id, selectedLanguage]); // Remove updateAnalysis from dependencies

  const updateAnalysis = useCallback(async (currentLines: LineData[]) => {
    console.log('AILyricsAssistant: updateAnalysis called with', currentLines.length, 'lines');
    try {
      const updatedLines = await Promise.all(
        currentLines.map(async (line, index) => {
          if (!line.text.trim()) {
            return { ...line, syllableCount: 0, rhymeLetter: '', suggestions: [] };
          }

          // Count syllables
          const words = line.text.split(/\s+/).filter(word => word.trim());
          const syllableCount = words.reduce((count, word) => 
            count + currentLanguage.syllableRules(word), 0
          );

          // Get AI suggestions for incomplete lines
          const suggestions = await generateLineSuggestions(line.text, selectedLanguage, index);

          return { ...line, syllableCount, suggestions };
        })
      );

      // Calculate rhyme scheme
      const rhymeScheme = await calculateRhymeScheme(updatedLines, selectedLanguage);
      const linesWithRhyme = updatedLines.map((line, index) => ({
        ...line,
        rhymeLetter: rhymeScheme[index] || ''
      }));

      console.log('AILyricsAssistant: analysis complete, updating lines');
      setLines(linesWithRhyme);
      
      // Update the parent component
      const lyricsText = linesWithRhyme.map(line => line.text).join('\n');
      if (section) {
        onLyricsUpdate(section.id, lyricsText);
      }
      console.log('AILyricsAssistant: parent updated');
    } catch (error) {
      console.error('AILyricsAssistant: error in updateAnalysis', error);
    }
  }, [currentLanguage, selectedLanguage, section, onLyricsUpdate]);

  const handleLineChange = useCallback((lineId: string, value: string) => {
    const updatedLines = lines.map(line => 
      line.id === lineId ? { ...line, text: value } : line
    );
    setLines(updatedLines);
    
    // Debounced analysis update
    setTimeout(() => updateAnalysis(updatedLines), 300);
  }, [lines, updateAnalysis]);

  const addNewLine = useCallback(() => {
    const newLine: LineData = {
      id: `line-${Date.now()}`,
      text: '',
      syllableCount: 0,
      rhymeLetter: '',
      suggestions: []
    };
    const updatedLines = [...lines, newLine];
    setLines(updatedLines);
  }, [lines]);

  const applySuggestion = useCallback((lineId: string, suggestion: string) => {
    handleLineChange(lineId, suggestion);
  }, [handleLineChange]);

  const startVoiceInput = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = selectedLanguage === 'en' ? 'en-US' : 
                     selectedLanguage === 'es' ? 'es-ES' :
                     selectedLanguage === 'fr' ? 'fr-FR' :
                     selectedLanguage === 'it' ? 'it-IT' :
                     selectedLanguage === 'de' ? 'de-DE' : 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (focusedLineId && transcript) {
        handleLineChange(focusedLineId, transcript);
      }
    };

    recognition.start();
  }, [selectedLanguage, focusedLineId, handleLineChange]);

  if (!section) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <div className="w-16 h-16 mx-auto mb-4 bg-music-primary/10 rounded-full flex items-center justify-center">
          <Edit className="w-8 h-8 text-music-primary" />
        </div>
        <h3 className="text-lg font-medium mb-2">AI Lyric Assistant</h3>
        <p>Select a section to start writing with AI-powered assistance</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Language Selection */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground">
            {section.name} Lyrics
          </h3>
          <p className="text-sm text-muted-foreground">
            AI-powered multilingual writing assistant
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={startVoiceInput}
            disabled={isListening || !focusedLineId}
            className="gap-2"
          >
            <Mic className={`w-4 h-4 ${isListening ? 'text-red-500' : ''}`} />
            {isListening ? 'Listening...' : 'Voice'}
          </Button>
        </div>
      </div>

      {/* Line-by-Line Editor */}
      <Card className="p-6">
        <div className="space-y-4">
          {lines.map((line, index) => (
            <div key={line.id} className="space-y-2">
              {/* Main Input Line */}
              <div className="flex items-center gap-3">
                {/* Rhyme Letter */}
                <div className="w-8 h-8 rounded-full bg-music-primary/10 flex items-center justify-center text-sm font-semibold text-music-primary">
                  {line.rhymeLetter || (index + 1)}
                </div>
                
                {/* Input Field */}
                <div className="flex-1 relative">
                  <Input
                    value={line.text}
                    onChange={(e) => handleLineChange(line.id, e.target.value)}
                    onFocus={() => setFocusedLineId(line.id)}
                    placeholder={`Line ${index + 1} - Start typing...`}
                    className="text-base"
                  />
                  
                  {/* AI Suggestion Overlay */}
                  {line.suggestions.length > 0 && focusedLineId === line.id && (
                    <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-md shadow-lg z-10 mt-1">
                      {line.suggestions.slice(0, 3).map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => applySuggestion(line.id, suggestion)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                        >
                          <Sparkles className="w-3 h-3 text-music-primary" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Syllable Count */}
                <div className="w-12 text-center">
                  <Badge variant="outline" className="text-xs">
                    {line.syllableCount}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
          
          {/* Add Line Button */}
          <Button
            variant="outline"
            onClick={addNewLine}
            className="w-full mt-4 gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Line
          </Button>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-semibold text-foreground">
            {lines.filter(line => line.text.trim()).length}
          </div>
          <div className="text-sm text-muted-foreground">Lines</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-semibold text-foreground">
            {Math.round(lines.reduce((sum, line) => sum + line.syllableCount, 0) / Math.max(lines.filter(line => line.text.trim()).length, 1))}
          </div>
          <div className="text-sm text-muted-foreground">Avg Syllables</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-semibold text-foreground">
            {new Set(lines.map(line => line.rhymeLetter).filter(Boolean)).size}
          </div>
          <div className="text-sm text-muted-foreground">Rhyme Groups</div>
        </Card>
      </div>
    </div>
  );
};

// Language-specific syllable counting functions
function countEnglishSyllables(word: string): number {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length <= 3) return 1;
  
  const vowels = 'aeiouy';
  let count = 0;
  let prevWasVowel = false;
  
  for (let i = 0; i < cleanWord.length; i++) {
    const isVowel = vowels.includes(cleanWord[i]);
    if (isVowel && !prevWasVowel) {
      count++;
    }
    prevWasVowel = isVowel;
  }
  
  if (cleanWord.endsWith('e') && count > 1) {
    count--;
  }
  
  return Math.max(1, count);
}

function countItalianSyllables(word: string): number {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length <= 2) return 1;
  
  const vowels = 'aeiou';
  let count = 0;
  let prevWasVowel = false;
  
  for (let i = 0; i < cleanWord.length; i++) {
    const isVowel = vowels.includes(cleanWord[i]);
    if (isVowel && !prevWasVowel) {
      count++;
    }
    prevWasVowel = isVowel;
  }
  
  return Math.max(1, count);
}

function countSpanishSyllables(word: string): number {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length <= 2) return 1;
  
  const vowels = 'aeiou';
  let count = 0;
  let prevWasVowel = false;
  
  for (let i = 0; i < cleanWord.length; i++) {
    const isVowel = vowels.includes(cleanWord[i]);
    if (isVowel && !prevWasVowel) {
      count++;
    }
    prevWasVowel = isVowel;
  }
  
  return Math.max(1, count);
}

function countFrenchSyllables(word: string): number {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length <= 2) return 1;
  
  const vowels = 'aeiouy';
  let count = 0;
  let prevWasVowel = false;
  
  for (let i = 0; i < cleanWord.length; i++) {
    const isVowel = vowels.includes(cleanWord[i]);
    if (isVowel && !prevWasVowel) {
      count++;
    }
    prevWasVowel = isVowel;
  }
  
  // French silent 'e' at the end
  if (cleanWord.endsWith('e') && count > 1) {
    count--;
  }
  
  return Math.max(1, count);
}

function countGermanSyllables(word: string): number {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length <= 2) return 1;
  
  const vowels = 'aeiouy';
  let count = 0;
  let prevWasVowel = false;
  
  for (let i = 0; i < cleanWord.length; i++) {
    const isVowel = vowels.includes(cleanWord[i]);
    if (isVowel && !prevWasVowel) {
      count++;
    }
    prevWasVowel = isVowel;
  }
  
  return Math.max(1, count);
}

// AI suggestion generation
async function generateLineSuggestions(currentText: string, language: string, lineIndex: number): Promise<string[]> {
  if (!currentText.trim()) return [];
  
  // Mock AI suggestions based on language and context
  const suggestions = [];
  const words = currentText.split(' ');
  const lastWord = words[words.length - 1];
  
  // Generate contextual suggestions based on language
  switch (language) {
    case 'en':
      if (lastWord.length > 2) {
        suggestions.push(
          currentText + ' shining bright',
          currentText + ' in the night',
          currentText + ' feels so right'
        );
      }
      break;
    case 'es':
      if (lastWord.length > 2) {
        suggestions.push(
          currentText + ' en el corazón',
          currentText + ' con pasión',
          currentText + ' sin razón'
        );
      }
      break;
    case 'it':
      if (lastWord.length > 2) {
        suggestions.push(
          currentText + ' nel cuore',
          currentText + ' con amore',
          currentText + ' ogni giorno'
        );
      }
      break;
    case 'fr':
      if (lastWord.length > 2) {
        suggestions.push(
          currentText + ' dans mon cœur',
          currentText + ' avec bonheur',
          currentText + ' sans peur'
        );
      }
      break;
    case 'de':
      if (lastWord.length > 2) {
        suggestions.push(
          currentText + ' in der Nacht',
          currentText + ' mit Bedacht',
          currentText + ' voller Pracht'
        );
      }
      break;
  }
  
  return suggestions.slice(0, 3);
}

// Rhyme scheme calculation
async function calculateRhymeScheme(lines: LineData[], language: string): Promise<string[]> {
  const scheme: string[] = [];
  const rhymeGroups: { [key: string]: string } = {};
  let currentLetter = 'A';
  
  for (const line of lines) {
    if (!line.text.trim()) {
      scheme.push('');
      continue;
    }
    
    const words = line.text.toLowerCase().split(/\s+/);
    const lastWord = words[words.length - 1]?.replace(/[^a-z]/g, '');
    
    if (!lastWord) {
      scheme.push('');
      continue;
    }
    
    // Simple rhyme detection based on word endings
    const rhymeKey = getSimpleRhymeKey(lastWord, language);
    
    if (rhymeGroups[rhymeKey]) {
      scheme.push(rhymeGroups[rhymeKey]);
    } else {
      rhymeGroups[rhymeKey] = currentLetter;
      scheme.push(currentLetter);
      currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
    }
  }
  
  return scheme;
}

function getSimpleRhymeKey(word: string, language: string): string {
  // Simplified rhyme detection - in production, use phonetic algorithms
  switch (language) {
    case 'en':
      return word.slice(-2); // Last 2 characters
    case 'es':
    case 'it':
      return word.slice(-2); // Last 2 characters
    case 'fr':
      return word.slice(-2); // Last 2 characters  
    case 'de':
      return word.slice(-2); // Last 2 characters
    default:
      return word.slice(-2);
  }
}

// Add type declarations for speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}