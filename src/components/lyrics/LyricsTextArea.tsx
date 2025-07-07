import React, { forwardRef, useCallback, useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { RhymeGroup } from './AILyricsAssistant';

interface LyricsTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  onWordSelect?: (word: string, position: number) => void;
  rhymeGroups?: RhymeGroup[];
  placeholder?: string;
  className?: string;
}

export const LyricsTextArea = forwardRef<HTMLTextAreaElement, LyricsTextAreaProps>(
  ({ value, onChange, onWordSelect, rhymeGroups = [], placeholder, className }, ref) => {
    const [selectionStart, setSelectionStart] = useState(0);
    const [selectionEnd, setSelectionEnd] = useState(0);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    }, [onChange]);

    const handleSelection = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      setSelectionStart(start);
      setSelectionEnd(end);

      if (start !== end && onWordSelect) {
        const selectedText = value.substring(start, end).trim();
        if (selectedText) {
          onWordSelect(selectedText, start);
        }
      }
    }, [value, onWordSelect]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Handle auto-completion triggers
      if (e.key === 'Tab' && onWordSelect) {
        e.preventDefault();
        const textarea = e.currentTarget;
        const cursorPos = textarea.selectionStart;
        
        // Find the word at cursor position
        const wordMatch = value.substring(0, cursorPos).match(/\b\w+$/);
        if (wordMatch) {
          onWordSelect(wordMatch[0], cursorPos - wordMatch[0].length);
        }
      }
    }, [value, onWordSelect]);

    const renderHighlightedText = () => {
      if (!rhymeGroups.length || !value) return null;

      const lines = value.split('\n');
      
      return (
        <div className="absolute inset-0 p-3 pointer-events-none overflow-hidden whitespace-pre-wrap break-words text-transparent">
          {lines.map((line, lineIndex) => {
            const words = line.split(/(\s+)/);
            
            return (
              <div key={lineIndex}>
                {words.map((word, wordIndex) => {
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
                        className="relative"
                        style={{
                          backgroundColor: `${rhymeGroup.color}15`,
                          borderBottom: `2px solid ${rhymeGroup.color}`,
                          borderRadius: '2px'
                        }}
                      >
                        {word}
                      </span>
                    );
                  }
                  
                  return <span key={wordIndex}>{word}</span>;
                })}
                {lineIndex < lines.length - 1 && '\n'}
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div className="relative">
        {renderHighlightedText()}
        <Textarea
          ref={ref}
          value={value}
          onChange={handleChange}
          onSelect={handleSelection}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "relative z-10 bg-transparent resize-none font-mono leading-relaxed",
            "focus:ring-2 focus:ring-music-primary/50 focus:border-music-primary",
            "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent",
            className
          )}
          style={{
            lineHeight: '1.6',
            letterSpacing: '0.025em'
          }}
        />
        
        {/* Live stats overlay */}
        <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs text-muted-foreground border border-border/50">
          <div className="flex items-center gap-3">
            <span>{value.split(/\s+/).filter(w => w.trim()).length} words</span>
            <span>{value.split('\n').filter(l => l.trim()).length} lines</span>
            <span>{rhymeGroups.length} rhymes</span>
          </div>
        </div>
      </div>
    );
  }
);

LyricsTextArea.displayName = 'LyricsTextArea';