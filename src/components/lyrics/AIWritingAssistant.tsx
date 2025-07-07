import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SongSection } from '../SongwriterTool';
import { LyricsAnalysis } from './AILyricsAssistant';
import { Edit, Search, Mic } from 'lucide-react';

interface AIWritingAssistantProps {
  currentLyrics: string;
  section: SongSection;
  onSuggestionSelect: (suggestion: string) => void;
  analysis: LyricsAnalysis | null;
}

interface AISuggestion {
  type: 'line' | 'word' | 'phrase' | 'structure';
  content: string;
  confidence: number;
  explanation: string;
}

export const AIWritingAssistant = ({
  currentLyrics,
  section,
  onSuggestionSelect,
  analysis
}: AIWritingAssistantProps) => {
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeMode, setActiveMode] = useState<'complete' | 'improve' | 'theme'>('complete');

  const generateSuggestions = useCallback(async (type: string, userPrompt?: string) => {
    setIsGenerating(true);
    
    try {
      // Mock AI generation - in production, integrate with actual AI APIs
      const newSuggestions = await mockAIGeneration(
        type, 
        currentLyrics, 
        section, 
        analysis, 
        userPrompt
      );
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsGenerating(false);
    }
  }, [currentLyrics, section, analysis]);

  const handlePromptSubmit = () => {
    if (prompt.trim()) {
      generateSuggestions('custom', prompt);
    }
  };

  const handleAutoComplete = () => {
    generateSuggestions('complete');
  };

  const handleImprove = () => {
    generateSuggestions('improve');
  };

  const handleThemeGeneration = () => {
    generateSuggestions('theme');
  };

  return (
    <div className="space-y-6">
      {/* AI Prompt Input */}
      <Card className="p-4">
        <h4 className="font-medium text-foreground mb-3">AI Writing Assistant</h4>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Describe what you want to write about..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePromptSubmit()}
              className="flex-1"
            />
            <Button 
              onClick={handlePromptSubmit}
              disabled={!prompt.trim() || isGenerating}
              className="shrink-0"
            >
              Generate
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAutoComplete}
              disabled={isGenerating}
            >
              Complete Line
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleImprove}
              disabled={isGenerating || !currentLyrics.trim()}
            >
              Improve
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleThemeGeneration}
              disabled={isGenerating}
            >
              Theme Ideas
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isGenerating && (
        <Card className="p-6 text-center">
          <div className="animate-spin w-6 h-6 mx-auto mb-3 border-2 border-music-primary border-t-transparent rounded-full" />
          <div className="text-sm text-muted-foreground">AI is writing...</div>
        </Card>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && !isGenerating && (
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">AI Suggestions</h4>
          {suggestions.map((suggestion, index) => (
            <Card 
              key={index}
              className="p-4 cursor-pointer hover:bg-music-primary/5 transition-colors"
              onClick={() => onSuggestionSelect(suggestion.content)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {suggestion.type}
                    </Badge>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 h-1 rounded-full mr-0.5 ${
                            i < Math.ceil(suggestion.confidence * 5)
                              ? 'bg-music-primary'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="font-medium text-foreground mb-1">
                    {suggestion.content}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {suggestion.explanation}
                  </div>
                </div>
                
                <Button variant="ghost" size="sm">
                  Use
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Writing Tips */}
      <Card className="p-4">
        <h4 className="font-medium text-foreground mb-3">Writing Tips</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          {getWritingTips(section, analysis).map((tip, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-music-primary mt-2 shrink-0" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Genre-Specific Guidance */}
      {analysis && (
        <Card className="p-4">
          <h4 className="font-medium text-foreground mb-3">Style Guide</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Language:</span>
              <Badge variant="secondary">{analysis.language.toUpperCase()}</Badge>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {getStyleGuide(section.name, analysis.language)}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// Mock AI generation function
async function mockAIGeneration(
  type: string,
  currentLyrics: string,
  section: SongSection,
  analysis: LyricsAnalysis | null,
  userPrompt?: string
): Promise<AISuggestion[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const suggestions: AISuggestion[] = [];

  switch (type) {
    case 'complete':
      if (currentLyrics.trim()) {
        const lastLine = currentLyrics.split('\n').pop()?.trim() || '';
        if (lastLine) {
          suggestions.push({
            type: 'line',
            content: generateCompletionLine(lastLine, section.name),
            confidence: 0.8,
            explanation: 'Continues the thought from your last line'
          });
        }
      } else {
        suggestions.push({
          type: 'line',
          content: generateStarterLine(section.name),
          confidence: 0.7,
          explanation: `Great opening line for a ${section.name.toLowerCase()}`
        });
      }
      break;

    case 'improve':
      if (currentLyrics.trim()) {
        suggestions.push({
          type: 'phrase',
          content: improveLastPhrase(currentLyrics),
          confidence: 0.75,
          explanation: 'More vivid imagery and stronger emotional impact'
        });
      }
      break;

    case 'theme':
      const themes = getThemeIdeas(section.name);
      themes.forEach((theme, index) => {
        suggestions.push({
          type: 'structure',
          content: theme.idea,
          confidence: 0.8 - (index * 0.1),
          explanation: theme.description
        });
      });
      break;

    case 'custom':
      if (userPrompt) {
        suggestions.push({
          type: 'line',
          content: generateFromPrompt(userPrompt, section.name),
          confidence: 0.85,
          explanation: `Generated based on your prompt: "${userPrompt}"`
        });
      }
      break;
  }

  return suggestions;
}

function generateCompletionLine(lastLine: string, sectionName: string): string {
  const completions = {
    'Verse 1': [
      'Walking down this empty street tonight',
      'Memories fade but you remain so bright',
      'Every step echoes what we used to be'
    ],
    'Chorus': [
      'And we will rise above it all',
      'Like stars that shine through endless night',
      'Together we can face tomorrow'
    ],
    'Bridge': [
      'But maybe there\'s another way',
      'If we could turn back time today',
      'Everything would be different now'
    ]
  };

  const options = completions[sectionName as keyof typeof completions] || completions['Verse 1'];
  return options[Math.floor(Math.random() * options.length)];
}

function generateStarterLine(sectionName: string): string {
  const starters = {
    'Verse 1': [
      'In the quiet of the morning light',
      'Sometimes I wonder where you are',
      'The city sleeps but I\'m awake'
    ],
    'Chorus': [
      'We are stronger than we know',
      'This is where our story begins',
      'Nothing can tear us apart'
    ],
    'Bridge': [
      'Take my hand and we\'ll fly away',
      'Maybe we\'ve been wrong all along',
      'There\'s a place where dreams come true'
    ]
  };

  const options = starters[sectionName as keyof typeof starters] || starters['Verse 1'];
  return options[Math.floor(Math.random() * options.length)];
}

function improveLastPhrase(lyrics: string): string {
  const lines = lyrics.split('\n').filter(l => l.trim());
  if (lines.length === 0) return 'Start with a strong opening line';
  
  const lastLine = lines[lines.length - 1];
  // Simple improvement suggestion
  return lastLine.replace(/good/g, 'amazing').replace(/bad/g, 'devastating');
}

function generateFromPrompt(prompt: string, sectionName: string): string {
  // Simple keyword-based generation
  if (prompt.includes('love')) {
    return 'Your love lights up my darkest days';
  } else if (prompt.includes('sad')) {
    return 'Tears fall like rain upon my face';
  } else if (prompt.includes('happy')) {
    return 'Dancing through this perfect moment';
  } else {
    return 'The story unfolds before our eyes';
  }
}

function getThemeIdeas(sectionName: string): Array<{ idea: string; description: string }> {
  const themes = {
    'Verse 1': [
      { idea: 'Setting the scene', description: 'Establish time, place, or emotional state' },
      { idea: 'Introducing the story', description: 'Present the main character or situation' },
      { idea: 'Creating atmosphere', description: 'Use sensory details to draw listeners in' }
    ],
    'Chorus': [
      { idea: 'The main message', description: 'Express the core emotion or theme' },
      { idea: 'Universal truth', description: 'Something everyone can relate to' },
      { idea: 'Emotional climax', description: 'The most powerful moment of the song' }
    ],
    'Bridge': [
      { idea: 'Plot twist', description: 'Introduce a new perspective or revelation' },
      { idea: 'Reflection', description: 'Look back on what\'s been learned' },
      { idea: 'Resolution', description: 'Show how the story concludes' }
    ]
  };

  return themes[sectionName as keyof typeof themes] || themes['Verse 1'];
}

function getWritingTips(section: SongSection, analysis: LyricsAnalysis | null): string[] {
  const tips = [];

  // Section-specific tips
  switch (section.name) {
    case 'Verse 1':
      tips.push('Start with a strong hook to grab attention');
      tips.push('Establish the story, character, or setting');
      break;
    case 'Chorus':
      tips.push('Make it memorable and easy to sing along');
      tips.push('Express the main emotion or message of the song');
      break;
    case 'Bridge':
      tips.push('Provide contrast from verses and chorus');
      tips.push('Add a new perspective or emotional shift');
      break;
  }

  // Analysis-based tips
  if (analysis) {
    if (analysis.complexity < 0.3) {
      tips.push('Consider adding more descriptive words or metaphors');
    }
    if (analysis.rhymeGroups.length === 0) {
      tips.push('Try adding some rhyming words for musical flow');
    }
    if (analysis.avgSyllablesPerLine > 15) {
      tips.push('Long lines might be hard to sing - consider breaking them up');
    }
  }

  // General tips
  tips.push('Show, don\'t tell - use concrete imagery');
  tips.push('Each line should advance the story or emotion');

  return tips;
}

function getStyleGuide(sectionName: string, language: string): string {
  const guides = {
    en: {
      'Verse 1': 'Use storytelling techniques, paint a picture with words, keep rhythm conversational',
      'Chorus': 'Focus on universal emotions, use strong verbs, make it anthemic',
      'Bridge': 'Break the pattern, try different rhythms, add musical contrast'
    },
    es: {
      'Verse 1': 'Usa técnicas narrativas, mantén el ritmo natural del español',
      'Chorus': 'Enfócate en emociones universales, usa verbos fuertes',
      'Bridge': 'Rompe el patrón, prueba ritmos diferentes'
    }
  };

  const langGuides = guides[language as keyof typeof guides] || guides.en;
  return langGuides[sectionName as keyof typeof langGuides] || langGuides['Verse 1'];
}