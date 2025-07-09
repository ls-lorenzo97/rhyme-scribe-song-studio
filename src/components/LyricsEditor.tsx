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

// Translation dictionary for LyricsEditor
const translations: Record<string, Record<string, string>> = {
  en: {
    lyrics: 'Lyrics',
    writeOnePhrasePerLine: 'Write one phrase per line. The last word of each line will be colored if it rhymes.',
    phrase: 'Phrase',
    suggestRhymes: 'Suggest rhymes for the last word',
    addLine: 'Add Line',
    removeLine: 'Remove Line'
  },
  it: {
    lyrics: 'Testo',
    writeOnePhrasePerLine: 'Scrivi una frase per riga. L\'ultima parola di ogni riga sarà colorata se fa rima.',
    phrase: 'Frase',
    suggestRhymes: 'Suggerisci rime per l\'ultima parola',
    addLine: 'Aggiungi Riga',
    removeLine: 'Rimuovi Riga'
  },
  es: {
    lyrics: 'Letra',
    writeOnePhrasePerLine: 'Escribe una frase por línea. La última palabra de cada línea se coloreará si rima.',
    phrase: 'Frase',
    suggestRhymes: 'Sugerir rimas para la última palabra',
    addLine: 'Agregar Línea',
    removeLine: 'Quitar Línea'
  },
  fr: {
    lyrics: 'Paroles',
    writeOnePhrasePerLine: 'Écrivez une phrase par ligne. Le dernier mot de chaque ligne sera coloré s\'il rime.',
    phrase: 'Phrase',
    suggestRhymes: 'Suggérer des rimes pour le dernier mot',
    addLine: 'Ajouter une Ligne',
    removeLine: 'Supprimer la Ligne'
  },
  de: {
    lyrics: 'Text',
    writeOnePhrasePerLine: 'Schreiben Sie einen Satz pro Zeile. Das letzte Wort jeder Zeile wird eingefärbt, wenn es reimt.',
    phrase: 'Satz',
    suggestRhymes: 'Reime für das letzte Wort vorschlagen',
    addLine: 'Zeile Hinzufügen',
    removeLine: 'Zeile Entfernen'
  }
};

function t(lang: string, key: string): string {
  return translations[lang]?.[key] || translations['en'][key] || key;
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

  const removeLine = (idx: number) => {
    if (lines.length > 1) {
      const newLines = lines.filter((_, i) => i !== idx);
      setLines(newLines);
      if (section) {
        onLyricsUpdate(section.id, newLines.join('\n'));
      }
    }
  };

  const handleOpenSuggestions = (idx: number) => {
    const words = lines[idx].trim().split(/\s+/);
    const lastWord = words[words.length-1] || '';
    setSuggestIdx(idx);
    setSuggestWord(lastWord);
  };

  const getRhymeColor = (idx: number) => {
    const rhymeColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    return rhymeColors[idx % rhymeColors.length];
  };

  const getRhymeLetter = (idx: number) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[idx % letters.length];
  };

  if (!section) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <h3 className="text-lg font-medium mb-2">{t(selectedLanguage, 'lyrics')}</h3>
        <p>Select a section to start writing lyrics</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          {section?.name} {t(selectedLanguage, 'lyrics')}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">
          {t(selectedLanguage, 'writeOnePhrasePerLine')}
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
                placeholder={`${t(selectedLanguage, 'phrase')} ${idx + 1}`}
                className="flex-1 h-8 px-2 py-1 rounded border bg-background text-sm focus:ring-2 focus:ring-music-primary outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                className="ml-1 px-1 py-0.5 rounded bg-muted/40 border text-xs text-muted-foreground hover:bg-music-primary/10"
                onClick={() => handleOpenSuggestions(idx)}
                title={t(selectedLanguage, 'suggestRhymes')}
              >
                💡
              </button>
              {lines.length > 1 && (
                <button
                  type="button"
                  className="ml-1 px-1 py-0.5 rounded bg-destructive/10 border border-destructive/20 text-xs text-destructive hover:bg-destructive/20"
                  onClick={() => removeLine(idx)}
                  title={t(selectedLanguage, 'removeLine')}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addLine}
        className="w-full"
      >
        + {t(selectedLanguage, 'addLine')}
      </Button>

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
              onSuggestionSelect={(word: string) => {
                if (suggestIdx === null) return;
                const newLines = [...lines];
                newLines[suggestIdx] = newLines[suggestIdx] + (newLines[suggestIdx].endsWith(' ') ? '' : ' ') + word;
                setLines(newLines);
                setSuggestIdx(null);
                setSuggestWord('');
                // Optionally trigger rhyme analysis
                handleLineChange(suggestIdx, newLines[suggestIdx]);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};