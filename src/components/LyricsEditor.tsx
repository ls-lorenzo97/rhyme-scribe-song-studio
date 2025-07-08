import { useState, useEffect, useMemo } from 'react';
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
}

export const LyricsEditor = ({ section, onLyricsUpdate, selectedLanguage = 'en', rhymeGroups, setRhymeGroups }: LyricsEditorProps) => {
  const [lines, setLines] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestIdx, setSuggestIdx] = useState<number|null>(null);
  const [suggestWord, setSuggestWord] = useState<string>('');

  const rhymeDetector = useMemo(() => new RhymeDetector(), []);

  useEffect(() => {
    if (section) {
      setLines(section.lyrics ? section.lyrics.split('\n') : ['']);
    }
  }, [section]);

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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {section?.name} Lyrics
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Scrivi una frase per riga. Le rime saranno colorate e marcate con una lettera.
        </p>
      </div>
      <div className="space-y-2">
        {lines.map((line, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {/* Rhyme Letter & Color */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-base font-bold border"
              style={{
                backgroundColor: getRhymeColor(idx) + '20',
                color: getRhymeColor(idx),
                borderColor: getRhymeColor(idx),
              }}
            >
              {getRhymeLetter(idx)}
            </div>
            {/* Single-line input */}
            <input
              type="text"
              value={line}
              onChange={e => handleLineChange(idx, e.target.value)}
              placeholder={`Frase ${idx + 1}`}
              className="flex-1 px-3 py-2 rounded border bg-background text-base focus:ring-2 focus:ring-music-primary outline-none"
              autoComplete="off"
            />
            {/* Rhyme Suggestion Button */}
            <button
              type="button"
              className="ml-1 px-2 py-1 rounded bg-muted/40 border text-xs text-muted-foreground hover:bg-music-primary/10"
              onClick={() => handleOpenSuggestions(idx)}
              title="Suggerisci rime per l'ultima parola"
            >
              💡
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addLine}
          className="mt-2 px-4 py-2 rounded bg-music-primary text-white font-semibold hover:bg-music-primary/80 transition"
        >
          + Aggiungi Frase
        </button>
      </div>
      {/* Rhyme Suggestions Dropdown/Modal */}
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
      {/* Live Preview */}
      <div className="mt-6">
        <h4 className="font-medium text-foreground mb-2">Anteprima con rime</h4>
        <div className="space-y-1 bg-muted/30 border border-border rounded-md px-3 py-3">
          {lines.map((line, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-base font-bold border"
                style={{
                  backgroundColor: getRhymeColor(idx) + '20',
                  color: getRhymeColor(idx),
                  borderColor: getRhymeColor(idx),
                }}
              >
                {getRhymeLetter(idx)}
              </span>
              <span style={{ color: getRhymeColor(idx) }}>
                {line}
              </span>
            </div>
          ))}
        </div>
      </div>
      {isAnalyzing && (
        <div className="text-music-primary text-sm flex items-center gap-2 mt-2">
          <span className="w-4 h-4">✨</span> Analisi delle rime in corso...
        </div>
      )}
    </div>
  );
}