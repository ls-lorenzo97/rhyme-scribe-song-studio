import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { RhymeSuggestions } from './RhymeSuggestions';
import type { SongSection } from '../SongwriterTool';

// Export types for other components
export interface RhymeGroup {
  id: string;
  words: string[];
  color: string;
  type: 'perfect' | 'near' | 'slant' | 'eye' | 'internal' | 'multisyllabic';
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
}

interface Language {
  code: string;
  name: string;
  syllableRules: (word: string) => number;
}

const languages: Language[] = [
  {
    code: 'en',
    name: 'English',
    syllableRules: (word: string) => {
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
  },
  {
    code: 'it',
    name: 'Italian',
    syllableRules: (word: string) => {
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
  },
  {
    code: 'es',
    name: 'Spanish',
    syllableRules: (word: string) => {
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
  },
  {
    code: 'fr',
    name: 'French',
    syllableRules: (word: string) => {
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
      
      if (cleanWord.endsWith('e') && count > 1) {
        count--;
      }
      
      return Math.max(1, count);
    }
  },
  {
    code: 'de',
    name: 'German',
    syllableRules: (word: string) => {
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
  }
];

const rhymeColors = [
  'hsl(var(--rhyme-1))',
  'hsl(var(--rhyme-2))',
  'hsl(var(--rhyme-3))',
  'hsl(var(--rhyme-4))',
  'hsl(var(--rhyme-5))'
];

interface AILyricsAssistantProps {
  section: SongSection | undefined;
  onLyricsUpdate: (sectionId: string, lyrics: string) => void;
}

export const AILyricsAssistant = ({ section, onLyricsUpdate }: AILyricsAssistantProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [lines, setLines] = useState<LineData[]>([]);
  const [selectedWord, setSelectedWord] = useState<string>('');
  
  const currentLanguage = languages.find(lang => lang.code === selectedLanguage) || languages[0];

  // Initialize default lines when section changes
  useEffect(() => {
    if (section) {
      const existingLines = section.lyrics ? section.lyrics.split('\n') : [];
      const initialLines: LineData[] = [];
      
      // Create 8 default lines or use existing
      for (let i = 0; i < Math.max(8, existingLines.length); i++) {
        initialLines.push({
          id: `line-${i}`,
          text: existingLines[i] || '',
          syllableCount: 0,
          rhymeLetter: ''
        });
      }
      
      setLines(initialLines);
      updateAnalysis(initialLines);
    }
  }, [section?.id, selectedLanguage]);

  const updateAnalysis = useCallback((currentLines: LineData[]) => {
    const updatedLines = currentLines.map((line, index) => {
      if (!line.text.trim()) {
        return { ...line, syllableCount: 0, rhymeLetter: '' };
      }

      // Count syllables
      const words = line.text.split(/\s+/).filter(word => word.trim());
      const syllableCount = words.reduce((count, word) => 
        count + currentLanguage.syllableRules(word), 0
      );

      return { ...line, syllableCount };
    });

    // Calculate rhyme scheme
    const rhymeScheme = calculateRhymeScheme(updatedLines, selectedLanguage);
    const linesWithRhyme = updatedLines.map((line, index) => ({
      ...line,
      rhymeLetter: rhymeScheme[index] || ''
    }));

    setLines(linesWithRhyme);
    
    // Update the parent component
    const lyricsText = linesWithRhyme.map(line => line.text).join('\n');
    if (section) {
      onLyricsUpdate(section.id, lyricsText);
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
      rhymeLetter: ''
    };
    const updatedLines = [...lines, newLine];
    setLines(updatedLines);
  }, [lines]);

  const handleWordSelect = useCallback((word: string) => {
    setSelectedWord(word);
  }, []);

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    // Find the last non-empty line and append the suggestion
    const lastLineIndex = lines.map(line => line.text.trim()).lastIndexOf('');
    if (lastLineIndex !== -1) {
      const targetLine = lines[lastLineIndex + 1] || lines[lines.length - 1];
      if (targetLine) {
        handleLineChange(targetLine.id, targetLine.text + (targetLine.text ? ' ' : '') + suggestion);
      }
    }
  }, [lines, handleLineChange]);

  const renderHighlightedText = (text: string, rhymeLetter: string) => {
    if (!text.trim()) return text;

    const words = text.split(/(\s+)/);
    const rhymeColorIndex = rhymeLetter.charCodeAt(0) - 'A'.charCodeAt(0);
    const color = rhymeColors[rhymeColorIndex % rhymeColors.length];

    return words.map((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      const isLastWord = index === words.length - 1 && cleanWord.length > 0;
      
      if (isLastWord && rhymeLetter) {
        return (
          <span
            key={index}
            style={{
              backgroundColor: `${color}20`,
              borderBottom: `2px solid ${color}`,
              borderRadius: '2px',
              padding: '1px 2px'
            }}
            onClick={() => handleWordSelect(cleanWord)}
            className="cursor-pointer"
          >
            {word}
          </span>
        );
      }
      
      return (
        <span key={index} onClick={() => cleanWord && handleWordSelect(cleanWord)} className="cursor-pointer">
          {word}
        </span>
      );
    });
  };

  if (!section) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <h3 className="text-lg font-medium mb-2">Lyrics Editor</h3>
        <p>Select a section to start writing lyrics</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Column - Lyrics Editor */}
      <div className="space-y-4">
        {/* Header with Language Selection */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              {section.name} Lyrics
            </h3>
          </div>
          
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Line-by-Line Editor */}
        <Card className="p-4">
          <div className="space-y-3">
            {lines.map((line, index) => (
              <div key={line.id} className="flex items-center gap-3">
                {/* Rhyme Letter */}
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                  style={{
                    backgroundColor: line.rhymeLetter ? 
                      rhymeColors[(line.rhymeLetter.charCodeAt(0) - 'A'.charCodeAt(0)) % rhymeColors.length] : 
                      'hsl(var(--muted))'
                  }}
                >
                  {line.rhymeLetter || (index + 1)}
                </div>
                
                {/* Input Field with Highlighting */}
                <div className="flex-1 relative">
                  <Input
                    value={line.text}
                    onChange={(e) => handleLineChange(line.id, e.target.value)}
                    placeholder={`Line ${index + 1}...`}
                    className="text-base bg-transparent"
                  />
                  
                  {/* Highlighted Text Overlay */}
                  {line.text && (
                    <div className="absolute inset-0 p-3 pointer-events-none text-transparent overflow-hidden whitespace-nowrap">
                      {renderHighlightedText(line.text, line.rhymeLetter)}
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
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <div className="text-lg font-semibold text-foreground">
              {lines.filter(line => line.text.trim()).length}
            </div>
            <div className="text-xs text-muted-foreground">Lines</div>
          </Card>
          
          <Card className="p-3 text-center">
            <div className="text-lg font-semibold text-foreground">
              {Math.round(lines.reduce((sum, line) => sum + line.syllableCount, 0) / Math.max(lines.filter(line => line.text.trim()).length, 1))}
            </div>
            <div className="text-xs text-muted-foreground">Avg Syllables</div>
          </Card>
          
          <Card className="p-3 text-center">
            <div className="text-lg font-semibold text-foreground">
              {new Set(lines.map(line => line.rhymeLetter).filter(Boolean)).size}
            </div>
            <div className="text-xs text-muted-foreground">Rhyme Groups</div>
          </Card>
        </div>
      </div>

      {/* Right Column - Rhyme Suggestions */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4">Rhyme Finder</h3>
        <Card className="p-4">
          <RhymeSuggestions
            selectedWord={selectedWord}
            language={selectedLanguage}
            onSuggestionSelect={handleSuggestionSelect}
          />
        </Card>
      </div>
    </div>
  );
};

// Rhyme scheme calculation
function calculateRhymeScheme(lines: LineData[], language: string): string[] {
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