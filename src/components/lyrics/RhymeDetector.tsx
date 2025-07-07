import { RhymeGroup } from './AILyricsAssistant';

export class RhymeDetector {
  private rhymeColors = [
    'hsl(var(--rhyme-1))',
    'hsl(var(--rhyme-2))',
    'hsl(var(--rhyme-3))',
    'hsl(var(--rhyme-4))',
    'hsl(var(--rhyme-5))',
  ];

  async detectRhymes(text: string, language: string = 'en'): Promise<RhymeGroup[]> {
    const lines = text.split('\n').filter(line => line.trim());
    const words: Array<{ 
      word: string; 
      line: number; 
      wordIndex: number; 
      startChar: number;
      endChar: number;
      phonetic: string;
    }> = [];
    
    let globalCharIndex = 0;
    
    lines.forEach((line, lineIndex) => {
      const lineWords = line.trim().split(/\s+/);
      let lineCharIndex = 0;
      
      lineWords.forEach((word, wordIndex) => {
        const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
        if (cleanWord.length > 2) {
          const phonetic = this.getPhoneticRepresentation(cleanWord, language);
          const startChar = globalCharIndex + lineCharIndex;
          const endChar = startChar + word.length;
          
          words.push({ 
            word: cleanWord, 
            line: lineIndex, 
            wordIndex, 
            startChar,
            endChar,
            phonetic
          });
        }
        lineCharIndex += word.length + 1; // +1 for space
      });
      
      globalCharIndex += line.length + 1; // +1 for newline
    });

    // Group words by phonetic similarity
    const phoneticGroups: { [key: string]: typeof words } = {};
    
    words.forEach(wordData => {
      const key = wordData.phonetic;
      if (!phoneticGroups[key]) {
        phoneticGroups[key] = [];
      }
      phoneticGroups[key].push(wordData);
    });

    // Create rhyme groups
    const rhymeGroups: RhymeGroup[] = [];
    let colorIndex = 0;

    Object.entries(phoneticGroups).forEach(([phonetic, groupWords]) => {
      if (groupWords.length > 1) {
        // Determine rhyme type and strength
        const { type, strength } = this.analyzeRhymeType(groupWords);
        
        rhymeGroups.push({
          id: `rhyme-${colorIndex}`,
          words: groupWords.map(w => w.word),
          color: this.rhymeColors[colorIndex % this.rhymeColors.length],
          type,
          strength,
          positions: groupWords.map(w => ({
            line: w.line,
            wordIndex: w.wordIndex,
            word: w.word,
            startChar: w.startChar,
            endChar: w.endChar
          }))
        });
        colorIndex++;
      }
    });

    // Detect internal rhymes
    const internalRhymes = this.detectInternalRhymes(lines, language);
    rhymeGroups.push(...internalRhymes.map((group, index) => ({
      ...group,
      id: `internal-${index}`,
      color: this.rhymeColors[(colorIndex + index) % this.rhymeColors.length]
    })));

    return rhymeGroups;
  }

  private getPhoneticRepresentation(word: string, language: string): string {
    // Simplified phonetic representation
    // In production, integrate with proper phonetic dictionary APIs
    
    switch (language) {
      case 'en':
        return this.getEnglishPhonetic(word);
      case 'es':
        return this.getSpanishPhonetic(word);
      case 'fr':
        return this.getFrenchPhonetic(word);
      default:
        return this.getGenericPhonetic(word);
    }
  }

  private getEnglishPhonetic(word: string): string {
    // Simplified English phonetic rules
    let phonetic = word.toLowerCase();
    
    // Common English rhyme endings
    phonetic = phonetic
      .replace(/ight$/, 'aɪt')
      .replace(/ough$/, 'ʌf')
      .replace(/tion$/, 'ʃən')
      .replace(/sion$/, 'ʒən')
      .replace(/ed$/, 't')
      .replace(/ing$/, 'ɪŋ')
      .replace(/ly$/, 'li')
      .replace(/y$/, 'i')
      .replace(/ey$/, 'i')
      .replace(/ay$/, 'eɪ')
      .replace(/oy$/, 'ɔɪ')
      .replace(/aw$/, 'ɔ')
      .replace(/ow$/, 'oʊ')
      .replace(/ew$/, 'u')
      .replace(/er$/, 'ər')
      .replace(/ar$/, 'ɑr')
      .replace(/or$/, 'ɔr')
      .replace(/ir$/, 'ɪr')
      .replace(/ur$/, 'ər');

    // Return last 2-3 phonemes for rhyming
    return phonetic.slice(-3);
  }

  private getSpanishPhonetic(word: string): string {
    // Spanish phonetic rules (simplified)
    let phonetic = word.toLowerCase();
    
    phonetic = phonetic
      .replace(/ción$/, 'θjon')
      .replace(/sión$/, 'sjon')
      .replace(/dad$/, 'ðað')
      .replace(/idad$/, 'ið̞að')
      .replace(/mente$/, 'mente')
      .replace(/ando$/, 'ando')
      .replace(/iendo$/, 'jendo')
      .replace(/ar$/, 'ar')
      .replace(/er$/, 'er')
      .replace(/ir$/, 'ir');

    return phonetic.slice(-3);
  }

  private getFrenchPhonetic(word: string): string {
    // French phonetic rules (simplified)
    let phonetic = word.toLowerCase();
    
    phonetic = phonetic
      .replace(/tion$/, 'sjɔ̃')
      .replace(/sion$/, 'zjɔ̃')
      .replace(/ment$/, 'mɑ̃')
      .replace(/ent$/, 'ɑ̃')
      .replace(/ant$/, 'ɑ̃')
      .replace(/age$/, 'aʒ')
      .replace(/ige$/, 'iʒ')
      .replace(/eur$/, 'œr')
      .replace(/aire$/, 'ɛr')
      .replace(/oire$/, 'war');

    return phonetic.slice(-3);
  }

  private getGenericPhonetic(word: string): string {
    // Generic fallback - use word endings
    return word.slice(-2);
  }

  private analyzeRhymeType(words: Array<{ word: string; phonetic: string }>): { 
    type: RhymeGroup['type']; 
    strength: number; 
  } {
    // Analyze rhyme quality
    const firstWord = words[0].word;
    const allSameEnding = words.every(w => 
      w.word.slice(-2) === firstWord.slice(-2)
    );
    
    if (allSameEnding) {
      return { type: 'perfect', strength: 1.0 };
    }
    
    // Check for near rhymes
    const vowelPattern = words.every(w => this.extractVowelPattern(w.word) === this.extractVowelPattern(firstWord));
    if (vowelPattern) {
      return { type: 'near', strength: 0.8 };
    }
    
    // Check for multi-syllabic
    const isMultiSyllabic = words.every(w => w.word.length > 6);
    if (isMultiSyllabic) {
      return { type: 'multisyllabic', strength: 0.9 };
    }
    
    return { type: 'near', strength: 0.6 };
  }

  private extractVowelPattern(word: string): string {
    return word.replace(/[^aeiou]/g, '');
  }

  private detectInternalRhymes(lines: string[], language: string): Omit<RhymeGroup, 'id' | 'color'>[] {
    const internalRhymes: Omit<RhymeGroup, 'id' | 'color'>[] = [];
    
    lines.forEach((line, lineIndex) => {
      const words = line.trim().split(/\s+/);
      if (words.length < 2) return;
      
      // Look for rhymes within the same line
      for (let i = 0; i < words.length - 1; i++) {
        for (let j = i + 1; j < words.length; j++) {
          const word1 = words[i].toLowerCase().replace(/[^a-z]/g, '');
          const word2 = words[j].toLowerCase().replace(/[^a-z]/g, '');
          
          if (word1.length > 2 && word2.length > 2) {
            const phonetic1 = this.getPhoneticRepresentation(word1, language);
            const phonetic2 = this.getPhoneticRepresentation(word2, language);
            
            if (phonetic1 === phonetic2 && word1 !== word2) {
              internalRhymes.push({
                words: [word1, word2],
                type: 'internal',
                strength: 0.7,
                positions: [
                  { line: lineIndex, wordIndex: i, word: word1, startChar: 0, endChar: word1.length },
                  { line: lineIndex, wordIndex: j, word: word2, startChar: 0, endChar: word2.length }
                ]
              });
            }
          }
        }
      }
    });
    
    return internalRhymes;
  }
}