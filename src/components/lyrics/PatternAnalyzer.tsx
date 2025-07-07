import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RhymeGroup, LyricsAnalysis } from './AILyricsAssistant';

interface PatternAnalyzerProps {
  analysis: LyricsAnalysis | null;
  rhymeGroups: RhymeGroup[];
  lyrics: string;
}

export const PatternAnalyzer = ({ analysis, rhymeGroups, lyrics }: PatternAnalyzerProps) => {
  if (!analysis) {
    return (
      <Card className="p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-music-primary/10 rounded-full flex items-center justify-center">
          <div className="text-xl">📊</div>
        </div>
        <h3 className="font-medium text-foreground mb-2">Pattern Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Start writing lyrics to see detailed pattern analysis
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rhyme Scheme Visualization */}
      <Card className="p-4">
        <h4 className="font-medium text-foreground mb-3">Rhyme Scheme</h4>
        <div className="space-y-2">
          {analysis.rhymeScheme.map((scheme, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded border-2 border-border bg-background flex items-center justify-center text-sm font-mono">
                {scheme}
              </div>
              <div className="text-sm text-muted-foreground">
                Line {index + 1}: {lyrics.split('\n')[index]?.trim() || 'Empty line'}
              </div>
            </div>
          ))}
        </div>
        
        {analysis.rhymeScheme.length > 0 && (
          <div className="mt-4 p-3 bg-muted/20 rounded">
            <div className="text-sm font-medium text-foreground mb-1">Pattern:</div>
            <div className="font-mono text-lg">
              {analysis.rhymeScheme.join(' ')}
            </div>
          </div>
        )}
      </Card>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <h4 className="font-medium text-foreground mb-3">Complexity</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Overall</span>
                <span>{Math.round(analysis.complexity * 100)}%</span>
              </div>
              <Progress value={analysis.complexity * 100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Readability</span>
                <span>{Math.round(analysis.readabilityScore)}%</span>
              </div>
              <Progress value={analysis.readabilityScore} className="h-2" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium text-foreground mb-3">Structure</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg syllables/line:</span>
              <span className="font-medium">{analysis.avgSyllablesPerLine.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rhyme density:</span>
              <span className="font-medium">
                {analysis.wordCount > 0 ? Math.round((rhymeGroups.length * 2 / analysis.wordCount) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Language:</span>
              <span className="font-medium">{analysis.language.toUpperCase()}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Rhyme Type Breakdown */}
      <Card className="p-4">
        <h4 className="font-medium text-foreground mb-3">Rhyme Analysis</h4>
        <div className="space-y-3">
          {rhymeGroups.length > 0 ? (
            rhymeGroups.map((group, index) => (
              <div key={group.id} className="flex items-center justify-between p-3 bg-muted/20 rounded">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: group.color }}
                  />
                  <div>
                    <div className="font-medium text-sm">
                      {group.words.join(', ')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {group.words.length} words
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {group.type}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(group.strength * 100)}%
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-muted-foreground py-4">
              No rhymes detected yet
            </div>
          )}
        </div>
      </Card>

      {/* Pattern Insights */}
      <Card className="p-4">
        <h4 className="font-medium text-foreground mb-3">Insights</h4>
        <div className="space-y-2 text-sm">
          {getPatternInsights(analysis, rhymeGroups).map((insight, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-music-primary mt-2 shrink-0" />
              <span className="text-muted-foreground">{insight}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// Pattern analysis class
class PatternAnalyzerClass {
  analyzeRhymeScheme(rhymeGroups: RhymeGroup[], lines: string[]): string[] {
    const scheme: string[] = [];
    const usedLetters: { [key: string]: string } = {};
    let currentLetter = 'A';

    lines.forEach((line, lineIndex) => {
      if (!line.trim()) {
        scheme.push('-');
        return;
      }

      const words = line.trim().split(/\s+/);
      const lastWord = words[words.length - 1]?.toLowerCase().replace(/[^a-z]/g, '');
      
      if (!lastWord) {
        scheme.push('-');
        return;
      }

      // Find which rhyme group this word belongs to
      const rhymeGroup = rhymeGroups.find(group =>
        group.positions.some(pos => pos.line === lineIndex && pos.word === lastWord)
      );

      if (rhymeGroup) {
        // Check if we've already assigned a letter to this rhyme group
        const groupKey = rhymeGroup.words.sort().join(',');
        if (usedLetters[groupKey]) {
          scheme.push(usedLetters[groupKey]);
        } else {
          usedLetters[groupKey] = currentLetter;
          scheme.push(currentLetter);
          currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
        }
      } else {
        // No rhyme found, assign new letter
        scheme.push(currentLetter);
        currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
      }
    });

    return scheme;
  }

  detectCommonPatterns(scheme: string[]): string[] {
    const patterns: string[] = [];
    const schemeStr = scheme.join('');

    // Common patterns
    if (/AABB/.test(schemeStr)) patterns.push('Rhyming Couplets (AABB)');
    if (/ABAB/.test(schemeStr)) patterns.push('Alternate Rhyme (ABAB)');
    if (/ABBA/.test(schemeStr)) patterns.push('Enclosed Rhyme (ABBA)');
    if (/AAAA/.test(schemeStr)) patterns.push('Monorhyme (AAAA)');
    if (/ABCB/.test(schemeStr)) patterns.push('Ballad Meter (ABCB)');

    return patterns;
  }
}

function getPatternInsights(analysis: LyricsAnalysis, rhymeGroups: RhymeGroup[]): string[] {
  const insights: string[] = [];

  // Complexity insights
  if (analysis.complexity > 0.8) {
    insights.push('High complexity detected - sophisticated word choice and rhyme patterns');
  } else if (analysis.complexity < 0.3) {
    insights.push('Simple structure - easy to follow and sing along');
  }

  // Rhyme insights
  if (rhymeGroups.length === 0) {
    insights.push('No rhymes detected - consider adding rhyming words for musical flow');
  } else if (rhymeGroups.length > analysis.lineCount * 0.5) {
    insights.push('High rhyme density - creates strong musical structure');
  }

  // Structure insights
  if (analysis.avgSyllablesPerLine > 12) {
    insights.push('Long lines - consider breaking into shorter phrases for easier singing');
  } else if (analysis.avgSyllablesPerLine < 4) {
    insights.push('Very short lines - creates punchy, rhythmic effect');
  }

  // Language-specific insights
  if (analysis.language === 'es') {
    insights.push('Spanish lyrics detected - consider traditional rhyme schemes like romance or décima');
  } else if (analysis.language === 'fr') {
    insights.push('French lyrics detected - masculine/feminine rhyme endings can add sophistication');
  }

  // Mood insights
  if (analysis.mood === 'positive') {
    insights.push('Positive tone detected - uplifting themes and bright imagery');
  } else if (analysis.mood === 'negative') {
    insights.push('Melancholic tone - emotional depth through darker themes');
  }

  if (insights.length === 0) {
    insights.push('Looking good! Keep writing to get more detailed insights');
  }

  return insights;
}