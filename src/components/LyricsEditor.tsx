import { useState, useEffect, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SongSection } from './SongwriterTool';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { RhymeDetector } from './lyrics/RhymeDetector';
import { RhymeGroup } from './lyrics/AILyricsAssistant';

interface LyricsEditorProps {
  section: SongSection | undefined;
  onLyricsUpdate: (sectionId: string, lyrics: string) => void;
  selectedLanguage?: string;
}

export const LyricsEditor = ({ section, onLyricsUpdate, selectedLanguage = 'en' }: LyricsEditorProps) => {
  const [lyrics, setLyrics] = useState('');
  const [showRhymes, setShowRhymes] = useState(true);
  const [rhymeGroups, setRhymeGroups] = useState<RhymeGroup[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const rhymeDetector = useMemo(() => new RhymeDetector(), []);

  useEffect(() => {
    if (section) {
      setLyrics(section.lyrics);
    }
  }, [section]);

  const handleLyricsChange = async (value: string) => {
    setLyrics(value);
    if (section) {
      onLyricsUpdate(section.id, value);
      
      // Analyze rhymes asynchronously
      if (value.trim()) {
        setIsAnalyzing(true);
        try {
          const detectedRhymes = await rhymeDetector.detectRhymes(value, selectedLanguage);
          setRhymeGroups(detectedRhymes);
        } catch (error) {
          console.error('Error detecting rhymes:', error);
          setRhymeGroups([]);
        } finally {
          setIsAnalyzing(false);
        }
      } else {
        setRhymeGroups([]);
      }
    }
  };

  // Initialize rhyme analysis when lyrics change
  useEffect(() => {
    if (lyrics.trim()) {
      handleLyricsChange(lyrics);
    }
  }, [selectedLanguage]); // Re-analyze when language changes

  const renderLyricsWithHighlights = () => {
    if (!showRhymes || !lyrics.trim()) return null;

    const lines = lyrics.split('\n');
    
    return (
      <div className="space-y-2 p-4 bg-muted/20 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-foreground">Lyrics Preview with Rhymes</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRhymes(!showRhymes)}
          >
            {showRhymes ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          </Button>
        </div>
        
        {lines.map((line, lineIndex) => (
          <div key={lineIndex} className="text-sm leading-relaxed">
            {line.split(/\s+/).map((word, wordIndex) => {
              const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
              const rhymeGroup = rhymeGroups.find(group => 
                group.positions.some(pos => 
                  pos.line === lineIndex && pos.word === cleanWord
                )
              );

              if (rhymeGroup && cleanWord.length > 2) {
                return (
                  <span
                    key={wordIndex}
                    className="px-1 py-0.5 rounded text-foreground font-medium"
                    style={{
                      backgroundColor: `${rhymeGroup.color}20`,
                      borderBottom: `2px solid ${rhymeGroup.color}`,
                    }}
                  >
                    {word}
                  </span>
                );
              }
              
              return <span key={wordIndex}>{word}</span>;
            }).reduce((prev, curr, index) => 
              index === 0 ? [curr] : [...prev, ' ', curr], [] as React.ReactNode[]
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!section) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <div className="w-12 h-12 mx-auto mb-4 opacity-50 text-2xl">✨</div>
        <p>Select a section to start writing lyrics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {section.name} Lyrics
        </h3>
        <p className="text-sm text-muted-foreground">
          Write your lyrics here. Rhymes will be automatically highlighted.
        </p>
      </div>

      <div className="space-y-4">
        <Textarea
          value={lyrics}
          onChange={(e) => handleLyricsChange(e.target.value)}
          placeholder={`Write lyrics for ${section.name}...`}
          className="min-h-[200px] resize-none bg-background/50 border-border focus:border-music-primary"
        />

        {(rhymeGroups.length > 0 || isAnalyzing) && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <div className="w-4 h-4 text-music-primary text-sm">✨</div>
              {isAnalyzing ? 'Analyzing Rhymes...' : `Detected Rhymes (${rhymeGroups.length} groups)`}
            </h4>
            {!isAnalyzing && (
              <div className="flex flex-wrap gap-2">
                {rhymeGroups.map((group, index) => (
                  <Badge
                    key={group.id || index}
                    variant="secondary"
                    className="text-xs"
                    style={{
                      backgroundColor: `${group.color}20`,
                      borderColor: group.color,
                      color: group.color,
                    }}
                  >
                    {group.words.join(', ')} ({group.words.length}) - {group.type} ({Math.round(group.strength * 100)}%)
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {renderLyricsWithHighlights()}
      </div>
    </div>
  );
};