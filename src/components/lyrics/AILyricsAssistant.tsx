import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { SongSection } from '../SongwriterTool';
import { LyricsTextArea } from './LyricsTextArea';
import { RhymeDetector } from './RhymeDetector';
import { RhymeSuggestions } from './RhymeSuggestions';
import { LanguageDetector } from './LanguageDetector';
import { PatternAnalyzer } from './PatternAnalyzer';
import { AIWritingAssistant } from './AIWritingAssistant';
import { Edit, Search, Mic } from 'lucide-react';

interface AILyricsAssistantProps {
  section: SongSection | undefined;
  onLyricsUpdate: (sectionId: string, lyrics: string) => void;
}

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

export const AILyricsAssistant = ({ section, onLyricsUpdate }: AILyricsAssistantProps) => {
  const [lyrics, setLyrics] = useState('');
  const [analysis, setAnalysis] = useState<LyricsAnalysis | null>(null);
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('write');
  const [isListening, setIsListening] = useState(false);
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const rhymeDetector = useMemo(() => new RhymeDetector(), []);
  const languageDetector = useMemo(() => new LanguageDetector(), []);

  useEffect(() => {
    if (section) {
      setLyrics(section.lyrics);
    }
  }, [section]);

  const handleLyricsChange = useCallback((value: string) => {
    setLyrics(value);
    if (section) {
      onLyricsUpdate(section.id, value);
    }
  }, [section, onLyricsUpdate]);

  const analyzeText = useCallback(async (text: string) => {
    if (!text.trim()) {
      setAnalysis(null);
      return;
    }

    setIsAnalyzing(true);
    try {
      const lines = text.split('\n').filter(line => line.trim());
      const words = text.split(/\s+/).filter(word => word.trim());
      
      // Basic metrics
      const wordCount = words.length;
      const lineCount = lines.length;
      
      // Syllable counting (simplified - can be enhanced with proper phonetic analysis)
      const syllableCount = words.reduce((count, word) => {
        return count + countSyllables(word);
      }, 0);
      
      const avgSyllablesPerLine = lineCount > 0 ? syllableCount / lineCount : 0;

      // Detect language
      const language = await languageDetector.detectLanguage(text);

      // Detect rhymes
      const rhymeGroups = await rhymeDetector.detectRhymes(text, language);

      // Analyze rhyme scheme  
      const rhymeScheme = analyzeRhymeScheme(rhymeGroups, lines);

      // Calculate complexity and mood (simplified)
      const complexity = calculateComplexity(rhymeGroups, words, syllableCount);
      const mood = await analyzeMood(text);
      const readabilityScore = calculateReadability(words, syllableCount, lineCount);

      setAnalysis({
        wordCount,
        lineCount,
        syllableCount,
        avgSyllablesPerLine,
        rhymeGroups,
        rhymeScheme,
        language,
        mood,
        complexity,
        readabilityScore
      });
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [rhymeDetector, languageDetector]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      analyzeText(lyrics);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [lyrics, analyzeText]);

  const handleWordSelection = useCallback((word: string, position: number) => {
    setSelectedWord(word);
    setCursorPosition(position);
    setActiveTab('rhymes');
  }, []);

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    if (!textAreaRef.current) return;

    const textarea = textAreaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Replace selected word or insert at cursor
    const newText = lyrics.substring(0, start) + suggestion + lyrics.substring(end);
    handleLyricsChange(newText);
    
    // Set cursor position after the inserted suggestion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + suggestion.length, start + suggestion.length);
    }, 0);
  }, [lyrics, handleLyricsChange]);

  const startVoiceInput = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = analysis?.language || 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        const newLyrics = lyrics + (lyrics ? '\n' : '') + finalTranscript;
        handleLyricsChange(newLyrics);
      }
    };

    recognition.start();
  }, [analysis?.language, lyrics, handleLyricsChange]);

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground">
            {section.name} Lyrics
          </h3>
          <p className="text-sm text-muted-foreground">
            AI-powered multilingual writing assistant
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={startVoiceInput}
            disabled={isListening}
            className="gap-2"
          >
            <Mic className={`w-4 h-4 ${isListening ? 'text-red-500' : ''}`} />
            {isListening ? 'Listening...' : 'Voice'}
          </Button>
          
          {analysis?.language && (
            <Badge variant="secondary" className="text-xs">
              {analysis.language.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {analysis && (
        <div className="grid grid-cols-4 gap-3">
          <Card className="p-3 bg-card/50">
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">{analysis.wordCount}</div>
              <div className="text-xs text-muted-foreground">Words</div>
            </div>
          </Card>
          <Card className="p-3 bg-card/50">
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">{analysis.lineCount}</div>
              <div className="text-xs text-muted-foreground">Lines</div>
            </div>
          </Card>
          <Card className="p-3 bg-card/50">
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">{analysis.rhymeGroups.length}</div>
              <div className="text-xs text-muted-foreground">Rhymes</div>
            </div>
          </Card>
          <Card className="p-3 bg-card/50">
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">{Math.round(analysis.complexity * 100)}%</div>
              <div className="text-xs text-muted-foreground">Complex</div>
            </div>
          </Card>
        </div>
      )}

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card className="p-4 bg-music-primary/5 border-music-primary/20">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-4 h-4 border-2 border-music-primary border-t-transparent rounded-full" />
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground mb-1">Analyzing lyrics...</div>
              <Progress value={75} className="h-1" />
            </div>
          </div>
        </Card>
      )}

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="write">Write</TabsTrigger>
          <TabsTrigger value="rhymes">Rhymes</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="ai">AI Assist</TabsTrigger>
        </TabsList>
        
        <TabsContent value="write" className="mt-4">
          <LyricsTextArea
            ref={textAreaRef}
            value={lyrics}
            onChange={handleLyricsChange}
            onWordSelect={handleWordSelection}
            rhymeGroups={analysis?.rhymeGroups || []}
            placeholder={`Write lyrics for ${section.name}...\n\nTip: Try voice input or get AI suggestions as you write.`}
            className="min-h-[300px]"
          />
        </TabsContent>
        
        <TabsContent value="rhymes" className="mt-4">
          <RhymeSuggestions
            selectedWord={selectedWord}
            language={analysis?.language || 'en'}
            onSuggestionSelect={handleSuggestionSelect}
            context={lyrics}
            mood={analysis?.mood}
          />
        </TabsContent>
        
        <TabsContent value="analysis" className="mt-4">
          <PatternAnalyzer
            analysis={analysis}
            rhymeGroups={analysis?.rhymeGroups || []}
            lyrics={lyrics}
          />
        </TabsContent>
        
        <TabsContent value="ai" className="mt-4">
          <AIWritingAssistant
            currentLyrics={lyrics}
            section={section}
            onSuggestionSelect={handleSuggestionSelect}
            analysis={analysis}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Utility functions
function countSyllables(word: string): number {
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

function calculateComplexity(rhymeGroups: RhymeGroup[], words: string[], syllableCount: number): number {
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  const rhymeDensity = rhymeGroups.length / Math.max(words.length, 1);
  const avgSyllables = syllableCount / Math.max(words.length, 1);
  
  return Math.min(1, (avgWordLength / 10 + rhymeDensity + avgSyllables / 3) / 3);
}

async function analyzeMood(text: string): Promise<string> {
  // Simplified mood analysis - in production, use sentiment analysis API
  const positiveWords = ['love', 'happy', 'joy', 'bright', 'smile', 'hope', 'dream', 'beautiful'];
  const negativeWords = ['sad', 'pain', 'cry', 'dark', 'lost', 'hurt', 'broken', 'lonely'];
  
  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function calculateReadability(words: string[], syllableCount: number, lineCount: number): number {
  // Simplified readability score
  const avgWordsPerLine = words.length / Math.max(lineCount, 1);
  const avgSyllablesPerWord = syllableCount / Math.max(words.length, 1);
  
  // Lower scores indicate higher readability
  const score = (avgWordsPerLine * 1.015) + (avgSyllablesPerWord * 84.6) - 206.835;
  return Math.max(0, Math.min(100, 100 - score / 2));
}

// Add type declarations for speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}