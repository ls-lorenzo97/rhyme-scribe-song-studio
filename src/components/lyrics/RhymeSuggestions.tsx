import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';

interface RhymeSuggestionsProps {
  selectedWord: string;
  language: string;
  onSuggestionSelect: (suggestion: string) => void;
  context?: string;
  mood?: string;
}

interface RhymeSuggestion {
  word: string;
  type: 'perfect' | 'near' | 'slant' | 'eye';
  syllables: number;
  frequency: number;
  meaning?: string;
  context: string[];
}

export const RhymeSuggestions = ({
  selectedWord,
  language,
  onSuggestionSelect,
  context = '',
  mood = 'neutral'
}: RhymeSuggestionsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<RhymeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const targetWord = searchTerm || selectedWord;

  const generateRhymes = useMemo(() => {
    return async (word: string, lang: string) => {
      if (!word.trim()) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      
      try {
        // In production, this would call actual rhyming APIs
        const rhymes = await getRhymesForWord(word, lang, mood, context);
        setSuggestions(rhymes);
      } catch (error) {
        console.error('Error generating rhymes:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };
  }, [mood, context]);

  useEffect(() => {
    if (targetWord) {
      generateRhymes(targetWord, language);
    }
  }, [targetWord, language, generateRhymes]);

  const groupedSuggestions = useMemo(() => {
    const grouped = {
      perfect: suggestions.filter(s => s.type === 'perfect'),
      near: suggestions.filter(s => s.type === 'near'),
      slant: suggestions.filter(s => s.type === 'slant'),
      eye: suggestions.filter(s => s.type === 'eye')
    };

    // Sort by frequency (common words first)
    Object.keys(grouped).forEach(key => {
      grouped[key as keyof typeof grouped].sort((a, b) => b.frequency - a.frequency);
    });

    return grouped;
  }, [suggestions]);

  const handleSuggestionClick = (suggestion: RhymeSuggestion) => {
    onSuggestionSelect(suggestion.word);
  };

  if (!targetWord) {
    return (
      <Card className="p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-music-primary/10 rounded-full flex items-center justify-center">
          <Search className="w-6 h-6 text-music-primary" />
        </div>
        <h3 className="font-medium text-foreground mb-2">Find Rhymes</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select a word in your lyrics or search for rhymes below
        </p>
        <Input
          placeholder="Enter a word to find rhymes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs mx-auto"
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search for rhymes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Badge variant="outline" className="text-xs">
          {language.toUpperCase()}
        </Badge>
      </div>

      {targetWord && (
        <div className="text-sm text-muted-foreground">
          Finding rhymes for: <span className="font-medium text-foreground">"{targetWord}"</span>
        </div>
      )}

      {isLoading ? (
        <Card className="p-6 text-center">
          <div className="animate-spin w-6 h-6 mx-auto mb-2 border-2 border-music-primary border-t-transparent rounded-full" />
          <div className="text-sm text-muted-foreground">Finding rhymes...</div>
        </Card>
      ) : (
        <Tabs defaultValue="perfect" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="perfect" className="text-xs">
              Perfect ({groupedSuggestions.perfect.length})
            </TabsTrigger>
            <TabsTrigger value="near" className="text-xs">
              Near ({groupedSuggestions.near.length})
            </TabsTrigger>
            <TabsTrigger value="slant" className="text-xs">
              Slant ({groupedSuggestions.slant.length})
            </TabsTrigger>
            <TabsTrigger value="eye" className="text-xs">
              Eye ({groupedSuggestions.eye.length})
            </TabsTrigger>
          </TabsList>

          {Object.entries(groupedSuggestions).map(([type, rhymes]) => (
            <TabsContent key={type} value={type} className="mt-4">
              {rhymes.length > 0 ? (
                <div className="grid gap-2 max-h-96 overflow-y-auto">
                  {rhymes.map((suggestion, index) => (
                    <Card
                      key={index}
                      className="p-3 cursor-pointer hover:bg-music-primary/5 transition-colors"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-foreground">
                            {suggestion.word}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.syllables} syl
                            </Badge>
                            
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-1 h-1 rounded-full mr-0.5 ${
                                    i < Math.ceil(suggestion.frequency * 5)
                                      ? 'bg-music-primary'
                                      : 'bg-muted'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {suggestion.meaning && (
                          <div className="text-xs text-muted-foreground max-w-32 truncate">
                            {suggestion.meaning}
                          </div>
                        )}
                      </div>
                      
                      {suggestion.context.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Often used with: {suggestion.context.slice(0, 3).join(', ')}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center">
                  <div className="text-sm text-muted-foreground">
                    No {type} rhymes found for "{targetWord}"
                  </div>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

// Mock rhyme generation function - in production, integrate with proper APIs
async function getRhymesForWord(
  word: string, 
  language: string, 
  mood: string, 
  context: string
): Promise<RhymeSuggestion[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const baseWord = word.toLowerCase().replace(/[^a-z]/g, '');
  
  // Mock rhyme data based on word endings
  const rhymeData: { [key: string]: RhymeSuggestion[] } = {
    // -ing endings
    'ing': [
      { word: 'sing', type: 'perfect', syllables: 1, frequency: 0.9, meaning: 'to vocalize music', context: ['song', 'voice', 'melody'] },
      { word: 'ring', type: 'perfect', syllables: 1, frequency: 0.8, meaning: 'circular band', context: ['wedding', 'bell', 'phone'] },
      { word: 'bring', type: 'perfect', syllables: 1, frequency: 0.9, meaning: 'to carry', context: ['take', 'carry', 'deliver'] },
      { word: 'king', type: 'perfect', syllables: 1, frequency: 0.7, meaning: 'ruler', context: ['crown', 'throne', 'royal'] },
      { word: 'thing', type: 'perfect', syllables: 1, frequency: 1.0, meaning: 'object', context: ['something', 'anything', 'everything'] }
    ],
    
    // -ay endings
    'ay': [
      { word: 'day', type: 'perfect', syllables: 1, frequency: 1.0, meaning: 'period of light', context: ['sun', 'morning', 'time'] },
      { word: 'way', type: 'perfect', syllables: 1, frequency: 1.0, meaning: 'path or method', context: ['path', 'road', 'direction'] },
      { word: 'say', type: 'perfect', syllables: 1, frequency: 1.0, meaning: 'to speak', context: ['tell', 'speak', 'voice'] },
      { word: 'play', type: 'perfect', syllables: 1, frequency: 0.9, meaning: 'to engage in activity', context: ['game', 'fun', 'sport'] },
      { word: 'stay', type: 'perfect', syllables: 1, frequency: 0.8, meaning: 'to remain', context: ['remain', 'wait', 'stop'] }
    ],
    
    // -ove endings
    'ove': [
      { word: 'love', type: 'perfect', syllables: 1, frequency: 1.0, meaning: 'deep affection', context: ['heart', 'romance', 'care'] },
      { word: 'dove', type: 'perfect', syllables: 1, frequency: 0.6, meaning: 'peace bird', context: ['peace', 'white', 'fly'] },
      { word: 'above', type: 'perfect', syllables: 2, frequency: 0.8, meaning: 'higher than', context: ['over', 'sky', 'up'] },
      { word: 'shove', type: 'perfect', syllables: 1, frequency: 0.5, meaning: 'to push', context: ['push', 'force', 'move'] }
    ]
  };

  // Find rhymes based on word ending
  const ending = baseWord.slice(-2);
  let rhymes = rhymeData[ending] || [];
  
  // If no direct matches, generate some near rhymes
  if (rhymes.length === 0) {
    rhymes = generateNearRhymes(baseWord);
  }
  
  // Filter out the original word
  rhymes = rhymes.filter(r => r.word !== baseWord);
  
  // Add some context-based filtering based on mood
  if (mood === 'positive') {
    rhymes = rhymes.filter(r => !['sad', 'cry', 'pain', 'hurt'].includes(r.word));
  } else if (mood === 'negative') {
    rhymes = rhymes.filter(r => !['happy', 'joy', 'smile', 'love'].includes(r.word));
  }
  
  return rhymes.slice(0, 20); // Limit results
}

function generateNearRhymes(word: string): RhymeSuggestion[] {
  // Generate some near rhymes based on vowel sounds
  const nearRhymes: RhymeSuggestion[] = [];
  
  // Simple near rhyme generation
  const lastVowel = word.match(/[aeiou]/g)?.pop();
  const commonWords = ['time', 'mind', 'find', 'light', 'night', 'right', 'heart', 'part', 'start'];
  
  commonWords.forEach(commonWord => {
    if (commonWord !== word && commonWord.includes(lastVowel || 'a')) {
      nearRhymes.push({
        word: commonWord,
        type: 'near',
        syllables: 1,
        frequency: 0.7,
        context: []
      });
    }
  });
  
  return nearRhymes;
}