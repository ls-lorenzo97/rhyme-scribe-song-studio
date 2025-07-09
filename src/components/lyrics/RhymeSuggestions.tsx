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

// Translation dictionary for RhymeSuggestions
const translations: Record<string, Record<string, string>> = {
  en: {
    findRhymes: 'Find Rhymes',
    selectWordOrSearch: 'Select a word in your lyrics or search for rhymes below',
    enterWordToFindRhymes: 'Enter a word to find rhymes...',
    searchForRhymes: 'Search for rhymes...',
    findingRhymesFor: 'Finding rhymes for:',
    findingRhymes: 'Finding rhymes...',
    perfect: 'Perfect',
    near: 'Near',
    slant: 'Slant',
    eye: 'Eye',
    syllables: 'syl',
    oftenUsedWith: 'Often used with:'
  },
  it: {
    findRhymes: 'Trova Rime',
    selectWordOrSearch: 'Seleziona una parola nel testo o cerca rime qui sotto',
    enterWordToFindRhymes: 'Inserisci una parola per trovare rime...',
    searchForRhymes: 'Cerca rime...',
    findingRhymesFor: 'Cercando rime per:',
    findingRhymes: 'Cercando rime...',
    perfect: 'Perfette',
    near: 'Vicine',
    slant: 'Assonanti',
    eye: 'Occhio',
    syllables: 'sill',
    oftenUsedWith: 'Spesso usato con:'
  },
  es: {
    findRhymes: 'Encontrar Rimas',
    selectWordOrSearch: 'Selecciona una palabra en tu letra o busca rimas abajo',
    enterWordToFindRhymes: 'Ingresa una palabra para encontrar rimas...',
    searchForRhymes: 'Buscar rimas...',
    findingRhymesFor: 'Buscando rimas para:',
    findingRhymes: 'Buscando rimas...',
    perfect: 'Perfectas',
    near: 'Cercanas',
    slant: 'Asonantes',
    eye: 'Ojo',
    syllables: 'síl',
    oftenUsedWith: 'A menudo usado con:'
  },
  fr: {
    findRhymes: 'Trouver des Rimes',
    selectWordOrSearch: 'Sélectionnez un mot dans vos paroles ou recherchez des rimes ci-dessous',
    enterWordToFindRhymes: 'Entrez un mot pour trouver des rimes...',
    searchForRhymes: 'Rechercher des rimes...',
    findingRhymesFor: 'Recherche de rimes pour:',
    findingRhymes: 'Recherche de rimes...',
    perfect: 'Parfaites',
    near: 'Proches',
    slant: 'Assonances',
    eye: 'Œil',
    syllables: 'syll',
    oftenUsedWith: 'Souvent utilisé avec:'
  },
  de: {
    findRhymes: 'Reime Finden',
    selectWordOrSearch: 'Wählen Sie ein Wort in Ihrem Text oder suchen Sie unten nach Reimen',
    enterWordToFindRhymes: 'Geben Sie ein Wort ein, um Reime zu finden...',
    searchForRhymes: 'Nach Reimen suchen...',
    findingRhymesFor: 'Suche nach Reimen für:',
    findingRhymes: 'Suche nach Reimen...',
    perfect: 'Perfekt',
    near: 'Nah',
    slant: 'Assonanz',
    eye: 'Auge',
    syllables: 'Silb',
    oftenUsedWith: 'Oft verwendet mit:'
  }
};

function t(lang: string, key: string): string {
  return translations[lang]?.[key] || translations['en'][key] || key;
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
        <h3 className="font-medium text-foreground mb-2">{t(language, 'findRhymes')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t(language, 'selectWordOrSearch')}
        </p>
        <Input
          placeholder={t(language, 'enterWordToFindRhymes')}
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
            placeholder={t(language, 'searchForRhymes')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Badge variant="outline" className="text-[15px] font-semibold px-3 py-1 min-w-[32px] text-center">
          {language.toUpperCase()}
        </Badge>
      </div>

      {targetWord && (
        <div className="text-sm text-muted-foreground">
          {t(language, 'findingRhymesFor')} <span className="font-medium text-foreground">"{targetWord}"</span>
        </div>
      )}

      {isLoading ? (
        <Card className="p-6 text-center">
          <div className="animate-spin w-6 h-6 mx-auto mb-2 border-2 border-music-primary border-t-transparent rounded-full" />
          <div className="text-sm text-muted-foreground">{t(language, 'findingRhymes')}</div>
        </Card>
      ) : (
        <Tabs defaultValue="perfect" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="perfect" className="text-xs">
              {t(language, 'perfect')} ({groupedSuggestions.perfect.length})
            </TabsTrigger>
            <TabsTrigger value="near" className="text-xs">
              {t(language, 'near')} ({groupedSuggestions.near.length})
            </TabsTrigger>
            <TabsTrigger value="slant" className="text-xs">
              {t(language, 'slant')} ({groupedSuggestions.slant.length})
            </TabsTrigger>
            <TabsTrigger value="eye" className="text-xs">
              {t(language, 'eye')} ({groupedSuggestions.eye.length})
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
                            <Badge variant="secondary" className="text-[15px] font-semibold px-3 py-1 min-w-[32px] text-center">
                              {suggestion.syllables} {t(language, 'syllables')}
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
                          {t(language, 'oftenUsedWith')} {suggestion.context.slice(0, 3).join(', ')}
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

// Enhanced rhyme generation function with comprehensive word database
async function getRhymesForWord(
  word: string, 
  language: string, 
  mood: string, 
  context: string
): Promise<RhymeSuggestion[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const baseWord = word.toLowerCase().replace(/[^a-z]/g, '');
  
  // Comprehensive rhyme database organized by language and sound patterns
  const rhymeDatabase: { [lang: string]: { [pattern: string]: RhymeSuggestion[] } } = {
    en: {
      // Perfect rhymes by sound patterns
      'ing': [
        { word: 'sing', type: 'perfect', syllables: 1, frequency: 0.9, meaning: 'to vocalize music', context: ['song', 'voice', 'melody'] },
        { word: 'ring', type: 'perfect', syllables: 1, frequency: 0.8, meaning: 'circular band', context: ['wedding', 'bell', 'phone'] },
        { word: 'bring', type: 'perfect', syllables: 1, frequency: 0.9, meaning: 'to carry', context: ['take', 'carry', 'deliver'] },
        { word: 'king', type: 'perfect', syllables: 1, frequency: 0.7, meaning: 'ruler', context: ['crown', 'throne', 'royal'] },
        { word: 'thing', type: 'perfect', syllables: 1, frequency: 1.0, meaning: 'object', context: ['something', 'anything', 'everything'] },
        { word: 'wing', type: 'perfect', syllables: 1, frequency: 0.6, meaning: 'flying appendage', context: ['bird', 'fly', 'angel'] },
        { word: 'spring', type: 'perfect', syllables: 1, frequency: 0.7, meaning: 'season or bounce', context: ['season', 'bounce', 'fresh'] },
        { word: 'swing', type: 'perfect', syllables: 1, frequency: 0.6, meaning: 'to move back and forth', context: ['playground', 'dance', 'movement'] }
      ],
      'ay': [
        { word: 'day', type: 'perfect', syllables: 1, frequency: 1.0, meaning: 'period of light', context: ['sun', 'morning', 'time'] },
        { word: 'way', type: 'perfect', syllables: 1, frequency: 1.0, meaning: 'path or method', context: ['path', 'road', 'direction'] },
        { word: 'say', type: 'perfect', syllables: 1, frequency: 1.0, meaning: 'to speak', context: ['tell', 'speak', 'voice'] },
        { word: 'play', type: 'perfect', syllables: 1, frequency: 0.9, meaning: 'to engage in activity', context: ['game', 'fun', 'sport'] },
        { word: 'stay', type: 'perfect', syllables: 1, frequency: 0.8, meaning: 'to remain', context: ['remain', 'wait', 'stop'] },
        { word: 'pray', type: 'perfect', syllables: 1, frequency: 0.7, meaning: 'to worship', context: ['hope', 'faith', 'wish'] },
        { word: 'may', type: 'perfect', syllables: 1, frequency: 0.9, meaning: 'possibility', context: ['might', 'could', 'perhaps'] },
        { word: 'gray', type: 'perfect', syllables: 1, frequency: 0.6, meaning: 'color', context: ['color', 'neutral', 'sky'] }
      ],
      'ove': [
        { word: 'love', type: 'perfect', syllables: 1, frequency: 1.0, meaning: 'deep affection', context: ['heart', 'romance', 'care'] },
        { word: 'dove', type: 'perfect', syllables: 1, frequency: 0.6, meaning: 'peace bird', context: ['peace', 'white', 'fly'] },
        { word: 'above', type: 'perfect', syllables: 2, frequency: 0.8, meaning: 'higher than', context: ['over', 'sky', 'up'] },
        { word: 'shove', type: 'perfect', syllables: 1, frequency: 0.5, meaning: 'to push', context: ['push', 'force', 'move'] }
      ],
      'ight': [
        { word: 'light', type: 'perfect', syllables: 1, frequency: 1.0, meaning: 'illumination', context: ['bright', 'sun', 'lamp'] },
        { word: 'night', type: 'perfect', syllables: 1, frequency: 1.0, meaning: 'darkness period', context: ['dark', 'moon', 'sleep'] },
        { word: 'right', type: 'perfect', syllables: 1, frequency: 1.0, meaning: 'correct or direction', context: ['correct', 'true', 'direction'] },
        { word: 'fight', type: 'perfect', syllables: 1, frequency: 0.8, meaning: 'to battle', context: ['battle', 'struggle', 'conflict'] },
        { word: 'sight', type: 'perfect', syllables: 1, frequency: 0.8, meaning: 'vision', context: ['see', 'view', 'eyes'] },
        { word: 'bright', type: 'perfect', syllables: 1, frequency: 0.8, meaning: 'shining', context: ['shining', 'smart', 'clear'] }
      ],
      'eart': [
        { word: 'heart', type: 'perfect', syllables: 1, frequency: 1.0, meaning: 'organ or emotion', context: ['love', 'feeling', 'organ'] },
        { word: 'part', type: 'perfect', syllables: 1, frequency: 0.9, meaning: 'portion', context: ['piece', 'section', 'divide'] },
        { word: 'start', type: 'perfect', syllables: 1, frequency: 0.9, meaning: 'beginning', context: ['begin', 'commence', 'initiate'] },
        { word: 'art', type: 'perfect', syllables: 1, frequency: 0.8, meaning: 'creative work', context: ['creative', 'painting', 'beauty'] },
        { word: 'smart', type: 'perfect', syllables: 1, frequency: 0.8, meaning: 'intelligent', context: ['clever', 'wise', 'bright'] }
      ]
    },
    it: {
      'are': [
        { word: 'amare', type: 'perfect', syllables: 3, frequency: 1.0, meaning: 'to love', context: ['amore', 'cuore', 'sentimento'] },
        { word: 'mare', type: 'perfect', syllables: 2, frequency: 0.9, meaning: 'sea', context: ['acqua', 'blu', 'onde'] },
        { word: 'stare', type: 'perfect', syllables: 2, frequency: 0.9, meaning: 'to stay', context: ['rimanere', 'restare', 'essere'] }
      ],
      'ore': [
        { word: 'amore', type: 'perfect', syllables: 3, frequency: 1.0, meaning: 'love', context: ['cuore', 'passione', 'sentimento'] },
        { word: 'cuore', type: 'perfect', syllables: 2, frequency: 0.9, meaning: 'heart', context: ['amore', 'sentimento', 'battito'] },
        { word: 'colore', type: 'perfect', syllables: 3, frequency: 0.8, meaning: 'color', context: ['rosso', 'blu', 'pittura'] }
      ]
    },
    es: {
      'ar': [
        { word: 'amar', type: 'perfect', syllables: 2, frequency: 1.0, meaning: 'to love', context: ['amor', 'corazón', 'querer'] },
        { word: 'mar', type: 'perfect', syllables: 1, frequency: 0.9, meaning: 'sea', context: ['agua', 'azul', 'olas'] },
        { word: 'cantar', type: 'perfect', syllables: 2, frequency: 0.8, meaning: 'to sing', context: ['música', 'voz', 'melodía'] }
      ],
      'or': [
        { word: 'amor', type: 'perfect', syllables: 2, frequency: 1.0, meaning: 'love', context: ['corazón', 'pasión', 'sentimiento'] },
        { word: 'dolor', type: 'perfect', syllables: 2, frequency: 0.8, meaning: 'pain', context: ['sufrir', 'herida', 'tristeza'] },
        { word: 'color', type: 'perfect', syllables: 2, frequency: 0.8, meaning: 'color', context: ['rojo', 'azul', 'pintura'] }
      ]
    },
    fr: {
      'eur': [
        { word: 'coeur', type: 'perfect', syllables: 1, frequency: 1.0, meaning: 'heart', context: ['amour', 'sentiment', 'battement'] },
        { word: 'fleur', type: 'perfect', syllables: 1, frequency: 0.9, meaning: 'flower', context: ['jardin', 'parfum', 'beauté'] },
        { word: 'bonheur', type: 'perfect', syllables: 2, frequency: 0.8, meaning: 'happiness', context: ['joie', 'plaisir', 'sourire'] }
      ],
      'oir': [
        { word: 'voir', type: 'perfect', syllables: 1, frequency: 1.0, meaning: 'to see', context: ['regarder', 'yeux', 'vision'] },
        { word: 'espoir', type: 'perfect', syllables: 2, frequency: 0.8, meaning: 'hope', context: ['espérer', 'rêve', 'futur'] },
        { word: 'soir', type: 'perfect', syllables: 1, frequency: 0.9, meaning: 'evening', context: ['nuit', 'coucher', 'repos'] }
      ]
    },
    de: {
      'ein': [
        { word: 'sein', type: 'perfect', syllables: 1, frequency: 1.0, meaning: 'to be', context: ['existieren', 'leben', 'dasein'] },
        { word: 'mein', type: 'perfect', syllables: 1, frequency: 0.9, meaning: 'my', context: ['besitz', 'eigen', 'gehören'] },
        { word: 'rein', type: 'perfect', syllables: 1, frequency: 0.7, meaning: 'pure', context: ['sauber', 'klar', 'unschuldig'] }
      ],
      'ich': [
        { word: 'ich', type: 'perfect', syllables: 1, frequency: 1.0, meaning: 'I', context: ['selbst', 'person', 'identität'] },
        { word: 'dich', type: 'perfect', syllables: 1, frequency: 0.9, meaning: 'you', context: ['du', 'person', 'liebe'] },
        { word: 'sich', type: 'perfect', syllables: 1, frequency: 0.8, meaning: 'oneself', context: ['selbst', 'reflexiv', 'person'] }
      ]
    }
  };

  // Get rhymes for specific language
  const langDatabase = rhymeDatabase[language] || rhymeDatabase.en;
  
  // Try different rhyme patterns for the word
  const patterns = generateRhymePatterns(baseWord, language);
  let allRhymes: RhymeSuggestion[] = [];
  
  patterns.forEach(pattern => {
    const rhymes = langDatabase[pattern] || [];
    allRhymes = [...allRhymes, ...rhymes];
  });
  
  // If no perfect rhymes found, generate near rhymes
  if (allRhymes.length === 0) {
    allRhymes = generateEnhancedNearRhymes(baseWord, language);
  }
  
  // Filter out the original word
  allRhymes = allRhymes.filter(r => r.word !== baseWord);
  
  // Remove duplicates
  const uniqueRhymes = allRhymes.filter((rhyme, index, array) => 
    array.findIndex(r => r.word === rhyme.word) === index
  );
  
  return uniqueRhymes.slice(0, 25); // Limit results
}

function generateRhymePatterns(word: string, language: string): string[] {
  const patterns: string[] = [];
  
  switch (language) {
    case 'en':
      // English patterns
      if (word.endsWith('ing')) patterns.push('ing');
      if (word.endsWith('ay') || word.endsWith('ey')) patterns.push('ay');
      if (word.endsWith('ove')) patterns.push('ove');
      if (word.endsWith('ight')) patterns.push('ight');
      if (word.endsWith('eart') || word.endsWith('art')) patterns.push('eart');
      // Fallback to last 2-3 characters
      patterns.push(word.slice(-2), word.slice(-3));
      break;
      
    case 'it':
      // Italian patterns
      if (word.endsWith('are')) patterns.push('are');
      if (word.endsWith('ore')) patterns.push('ore');
      patterns.push(word.slice(-2), word.slice(-3));
      break;
      
    case 'es':
      // Spanish patterns
      if (word.endsWith('ar')) patterns.push('ar');
      if (word.endsWith('or')) patterns.push('or');
      patterns.push(word.slice(-2), word.slice(-3));
      break;
      
    case 'fr':
      // French patterns
      if (word.endsWith('eur')) patterns.push('eur');
      if (word.endsWith('oir')) patterns.push('oir');
      patterns.push(word.slice(-2), word.slice(-3));
      break;
      
    case 'de':
      // German patterns
      if (word.endsWith('ein')) patterns.push('ein');
      if (word.endsWith('ich')) patterns.push('ich');
      patterns.push(word.slice(-2), word.slice(-3));
      break;
      
    default:
      patterns.push(word.slice(-2), word.slice(-3));
  }
  
  return patterns.filter((p, i, arr) => arr.indexOf(p) === i && p.length > 0);
}

function generateEnhancedNearRhymes(word: string, language: string): RhymeSuggestion[] {
  const nearRhymes: RhymeSuggestion[] = [];
  
  // Enhanced near rhyme generation based on phonetic similarities
  const commonWordsByLanguage: { [lang: string]: string[] } = {
    en: ['time', 'mind', 'find', 'light', 'night', 'right', 'heart', 'part', 'start', 'dream', 'seem', 'team', 'life', 'wife', 'knife', 'soul', 'goal', 'whole', 'fire', 'desire', 'inspire'],
    it: ['vita', 'bella', 'stella', 'cuore', 'amore', 'dolore', 'sole', 'parole', 'fiore', 'colore', 'cantare', 'sognare', 'volare'],
    es: ['vida', 'bella', 'estrella', 'corazón', 'canción', 'pasión', 'amor', 'dolor', 'color', 'sol', 'voz', 'luz'],
    fr: ['vie', 'belle', 'coeur', 'fleur', 'bonheur', 'douleur', 'amour', 'jour', 'nuit', 'lumière', 'rêve', 'âme'],
    de: ['leben', 'lieben', 'herz', 'schmerz', 'licht', 'nacht', 'traum', 'baum', 'zeit', 'welt', 'seele', 'liebe']
  };
  
  const commonWords = commonWordsByLanguage[language] || commonWordsByLanguage.en;
  const lastTwoChars = word.slice(-2);
  const lastVowel = word.match(/[aeiou]/g)?.pop();
  
  commonWords.forEach(commonWord => {
    if (commonWord !== word) {
      const commonLastTwo = commonWord.slice(-2);
      const commonLastVowel = commonWord.match(/[aeiou]/g)?.pop();
      
      let type: 'near' | 'slant' | 'eye' = 'near';
      let frequency = 0.6;
      
      // Determine rhyme type based on similarity
      if (lastTwoChars === commonLastTwo) {
        type = 'near';
        frequency = 0.8;
      } else if (lastVowel === commonLastVowel) {
        type = 'slant';
        frequency = 0.7;
      } else if (word.slice(-1) === commonWord.slice(-1)) {
        type = 'eye';
        frequency = 0.5;
      }
      
      if (frequency > 0.4) {
        nearRhymes.push({
          word: commonWord,
          type,
          syllables: Math.max(1, commonWord.split(/[aeiou]/).length - 1),
          frequency,
          context: []
        });
      }
    }
  });
  
  return nearRhymes;
}