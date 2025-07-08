import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  selectedLanguage: string;
  rhymeGroups: RhymeGroup[];
}

export const AILyricsAssistant = ({ section, onLyricsUpdate, selectedLanguage, rhymeGroups }: AILyricsAssistantProps) => {
  const [lines, setLines] = useState<LineData[]>([]);
  const [selectedWord, setSelectedWord] = useState<string>('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  
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

      // Count syllables only when needed
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
    // Clear existing timeout to prevent multiple analysis runs
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Immediately update the lines state for responsive typing
    const updatedLines = lines.map(line => 
      line.id === lineId ? { ...line, text: value } : line
    );
    setLines(updatedLines);
    
    // Debounce the analysis to only run when user stops typing
    debounceTimeoutRef.current = setTimeout(() => {
      updateAnalysis(updatedLines);
    }, 1500);
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);


  if (!section) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <h3 className="text-lg font-medium mb-2">Lyrics Editor</h3>
        <p>Select a section to start writing lyrics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-foreground">
          {section.name} Lyrics
        </h3>
      </div>

      {/* Quick Stats - Moved to top and made smaller */}
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

      {/* Lyrics Editor */}
      <Card className="p-6">
        <div className="space-y-4">
          {lines.map((line, index) => (
            <div key={line.id} className="flex items-start gap-4">
              {/* Rhyme Letter */}
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white mt-1 flex-shrink-0"
                style={{
                  backgroundColor: line.rhymeLetter ? 
                    rhymeColors[(line.rhymeLetter.charCodeAt(0) - 'A'.charCodeAt(0)) % rhymeColors.length] : 
                    'hsl(var(--muted))'
                }}
              >
                {line.rhymeLetter || (index + 1)}
              </div>
              {/* Text Input */}
              <div className="flex-1 min-w-0 space-y-2">
                <textarea
                  value={line.text}
                  onChange={(e) => handleLineChange(line.id, e.target.value)}
                  onClick={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    const text = target.value;
                    const cursorPos = target.selectionStart;
                    const words = text.split(/\s+/);
                    let charCount = 0;
                    for (let i = 0; i < words.length; i++) {
                      if (charCount <= cursorPos && cursorPos <= charCount + words[i].length) {
                        const cleanWord = words[i].toLowerCase().replace(/[^a-z]/g, '');
                        if (cleanWord.length > 2) {
                          handleWordSelect(cleanWord);
                        }
                        break;
                      }
                      charCount += words[i].length + 1;
                    }
                  }}
                  placeholder={`Line ${index + 1}...`}
                  className="w-full text-base bg-background border border-input rounded-md px-3 py-2 min-h-[3rem] resize-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
                  style={{ 
                    minHeight: '3rem',
                    lineHeight: '1.5'
                  }}
                />
                {/* Rhyme Info Box */}
                <div className="flex gap-2 items-center mt-1">
                  {/* Rhyme Tail/IPA Box */}
                  <div className="px-2 py-1 rounded bg-muted/40 border text-xs text-muted-foreground">
                    {/* Show rhyme tail or IPA for this line's last word if available */}
                    {(() => {
                      // Find rhyme group for this line
                      const rhymeGroup = rhymeGroups.find(group => group.positions.some(pos => pos.line === index));
                      if (rhymeGroup) {
                        const pos = rhymeGroup.positions.find(pos => pos.line === index);
                        return pos && pos.word ? `Rhyme: ${pos.word}` : 'No rhyme';
                      }
                      return 'No rhyme';
                    })()}
                  </div>
                  {/* Rhyme Group Box */}
                  <div className="px-2 py-1 rounded bg-muted/40 border text-xs text-muted-foreground">
                    {(() => {
                      const rhymeGroup = rhymeGroups.find(group => group.positions.some(pos => pos.line === index));
                      return rhymeGroup ? `Group: ${rhymeGroup.words.join(', ')}` : 'No group';
                    })()}
                  </div>
                </div>
                {/* Colored Preview */}
                {line.text.trim() && (
                  <div className="w-full text-base bg-muted/30 border border-border rounded-md px-3 py-2 min-h-[3rem] text-muted-foreground">
                    {line.text.split(/(\s+)/).map((part, partIndex) => {
                      if (/\s/.test(part)) return <span key={partIndex}>{part}</span>;
                      
                      const cleanWord = part.toLowerCase().replace(/[^a-z]/g, '');
                      
                      // Find if this word rhymes with others
                      const rhymingLines = lines.filter(l => l.rhymeLetter === line.rhymeLetter);
                      const hasRhyme = rhymingLines.length > 1 && cleanWord.length > 2;
                      
                      if (hasRhyme && line.rhymeLetter) {
                        const colorIndex = (line.rhymeLetter.charCodeAt(0) - 'A'.charCodeAt(0)) % 5;
                        const rhymeColor = rhymeColors[colorIndex];
                        
                        return (
                          <span 
                            key={partIndex}
                            className="font-medium"
                            style={{
                              color: rhymeColor
                            }}
                          >
                            {part}
                          </span>
                        );
                      }
                      
                      return <span key={partIndex}>{part}</span>;
                    })}
                  </div>
                )}
              </div>
              
              {/* Syllable Count */}
              <div className="w-16 text-center mt-1 flex-shrink-0">
                <Badge variant="outline" className="text-[15px] font-semibold px-3 py-1 min-w-[32px] text-center">
                  {line.syllableCount}
                </Badge>
              </div>
            </div>
          ))}
          
          {/* Add Line Button */}
          <Button
            variant="outline"
            onClick={addNewLine}
            className="w-full mt-6 gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Line
          </Button>
        </div>
      </Card>


      {/* Rhyme Finder Section */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4">Rhyme Finder</h3>
        <Card className="p-6">
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
  // Require minimum 3 characters for rhyme detection
  if (word.length < 3) return '';
  
  switch (language) {
    case 'it':
      return getItalianRhymeKey(word);
    case 'en':
      return getEnglishRhymeKey(word);
    case 'es':
      return getSpanishRhymeKey(word);
    case 'fr':
      return getFrenchRhymeKey(word);
    case 'de':
      return getGermanRhymeKey(word);
    default:
      return word.slice(-2);
  }
}

function getItalianRhymeKey(word: string): string {
  // Italian rhyme patterns - focus on common endings
  const commonEndings = {
    // Perfect rhymes - same sound
    'ale': 'ale',
    'are': 'are', 
    'ere': 'ere',
    'ire': 'ire',
    'ore': 'ore',
    'ato': 'ato',
    'eto': 'eto',
    'ito': 'ito',
    'oto': 'oto',
    'uto': 'uto',
    'ane': 'ane',
    'ene': 'ene',
    'ine': 'ine',
    'one': 'one',
    'une': 'une',
    'ante': 'ante',
    'ente': 'ente',
    'mente': 'mente',
    'zione': 'zione',
    'sione': 'sione'
  };
  
  // Check for longer endings first
  for (const [ending, key] of Object.entries(commonEndings)) {
    if (word.endsWith(ending)) {
      return key;
    }
  }
  
  // Fall back to last 3 characters for other cases
  return word.slice(-3);
}

function getEnglishRhymeKey(word: string): string {
  // Common English endings
  if (word.endsWith('ight')) return 'ight';
  if (word.endsWith('ough')) return 'ough';
  if (word.endsWith('tion')) return 'tion';
  if (word.endsWith('sion')) return 'sion';
  return word.slice(-2);
}

function getSpanishRhymeKey(word: string): string {
  // Common Spanish endings
  if (word.endsWith('ción')) return 'ción';
  if (word.endsWith('sión')) return 'sión';
  if (word.endsWith('ando')) return 'ando';
  if (word.endsWith('iendo')) return 'iendo';
  return word.slice(-2);
}

function getFrenchRhymeKey(word: string): string {
  // Common French endings
  if (word.endsWith('tion')) return 'tion';
  if (word.endsWith('sion')) return 'sion';
  if (word.endsWith('ment')) return 'ment';
  return word.slice(-2);
}

function getGermanRhymeKey(word: string): string {
  // Common German endings
  if (word.endsWith('ung')) return 'ung';
  if (word.endsWith('heit')) return 'heit';
  if (word.endsWith('keit')) return 'keit';
  return word.slice(-2);
}