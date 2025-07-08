import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SongSection } from './SongwriterTool';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { RhymeDetector } from './lyrics/RhymeDetector';
import { RhymeGroup } from './lyrics/AILyricsAssistant';
import { RhymeSuggestions } from './lyrics/RhymeSuggestions';

interface LyricsEditorProps {
  section: SongSection | undefined;
  onLyricsUpdate: (sectionId: string, lyrics: string) => void;
  selectedLanguage?: string;
  rhymeGroups: RhymeGroup[];
  setRhymeGroups: React.Dispatch<React.SetStateAction<RhymeGroup[]>>;
  onLyricsChange?: (lines: string[], rhymeGroups: RhymeGroup[]) => void;
}

export const LyricsEditor = ({ section, onLyricsUpdate, selectedLanguage = 'en', rhymeGroups, setRhymeGroups, onLyricsChange }: LyricsEditorProps) => {
  const [lines, setLines] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestIdx, setSuggestIdx] = useState<number|null>(null);
  const [suggestWord, setSuggestWord] = useState<string>('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const rhymeDetector = useMemo(() => new RhymeDetector(), []);

  useEffect(() => {
    if (section) {
      setLines(section.lyrics ? section.lyrics.split('\n') : ['']);
    }
  }, [section]);

  useEffect(() => {
    if (onLyricsChange) onLyricsChange(lines, rhymeGroups);
  }, [lines, rhymeGroups, onLyricsChange]);

  const handleLineChange = async (idx: number, value: string) => {
    const newLines = [...lines];
    newLines[idx] = value;
    setLines(newLines);
    if (section) {
      onLyricsUpdate(section.id, newLines.join('\n'));
    }
    // Analyze rhymes
    const text = newLines.join('\n');
    if (text.trim()) {
      setIsAnalyzing(true);
      try {
        const detectedRhymes = await rhymeDetector.detectRhymes(text, selectedLanguage as 'it'|'en'|'es'|'fr'|'de');
        setRhymeGroups(detectedRhymes as RhymeGroup[]);
      } catch (error) {
        setRhymeGroups([]);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      setRhymeGroups([]);
    }
  };

  const addLine = () => {
    setLines([...lines, '']);
  };

  const handleOpenSuggestions = (idx: number) => {
    const words = lines[idx].trim().split(/\s+/);
    const lastWord = words[words.length-1] || '';
    setSuggestIdx(idx);
    setSuggestWord(lastWord);
  };
  const handleSuggestionSelect = (word: string) => {
    if (suggestIdx === null) return;
    const newLines = [...lines];
    newLines[suggestIdx] = newLines[suggestIdx] + (newLines[suggestIdx].endsWith(' ') ? '' : ' ') + word;
    setLines(newLines);
    setSuggestIdx(null);
    setSuggestWord('');
    // Optionally trigger rhyme analysis
    handleLineChange(suggestIdx, newLines[suggestIdx]);
  };

  // Get rhyme letter for each line
  const getRhymeLetter = (lineIdx: number) => {
    const group = rhymeGroups.find(g => g.positions.some(pos => pos.line === lineIdx));
    if (!group) return '';
    // Assign a letter based on group index
    const idx = rhymeGroups.indexOf(group);
    return String.fromCharCode(65 + idx); // A, B, C...
  };
  const getRhymeColor = (lineIdx: number) => {
    const group = rhymeGroups.find(g => g.positions.some(pos => pos.line === lineIdx));
    return group ? group.color : 'hsl(var(--muted))';
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          {section?.name} Lyrics
        </h3>
        <p className="text-xs text-muted-foreground mb-2">
          Scrivi una frase per riga. L'ultima parola di ogni riga sarà colorata se fa rima.
        </p>
      </div>
      <div className="space-y-1">
        {lines.map((line, idx) => {
          return (
            <div key={idx} className="flex items-center gap-1 relative">
              <div
                className="min-w-7 min-h-7 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border flex-shrink-0"
                style={{
                  backgroundColor: getRhymeColor(idx) + '20',
                  color: getRhymeColor(idx),
                  borderColor: getRhymeColor(idx),
                }}
              >
                {getRhymeLetter(idx)}
              </div>
              <input
                type="text"
                value={line}
                onChange={e => handleLineChange(idx, e.target.value)}
                placeholder={`Frase ${idx + 1}`}
                className="flex-1 h-8 px-2 py-1 rounded border bg-background text-sm focus:ring-2 focus:ring-music-primary outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                className="ml-1 px-1 py-0.5 rounded bg-muted/40 border text-xs text-muted-foreground hover:bg-music-primary/10"
                onClick={() => handleOpenSuggestions(idx)}
                title="Suggerisci rime per l'ultima parola"
              >
                💡
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={addLine}
          className="mt-1 px-3 py-1 rounded bg-music-primary text-white text-sm font-semibold hover:bg-music-primary/80 transition"
        >
          + Aggiungi Frase
        </button>
      </div>
      {suggestIdx !== null && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-lg text-muted-foreground hover:text-foreground"
              onClick={() => setSuggestIdx(null)}
            >
              ×
            </button>
            <RhymeSuggestions
              selectedWord={suggestWord}
              language={selectedLanguage}
              onSuggestionSelect={handleSuggestionSelect}
            />
          </div>
        </div>
      )}
      {isAnalyzing && (
        <div className="text-music-primary text-xs flex items-center gap-2 mt-1">
          <span className="w-4 h-4">✨</span> Analisi delle rime in corso...
        </div>
      )}
    </div>
  );
}