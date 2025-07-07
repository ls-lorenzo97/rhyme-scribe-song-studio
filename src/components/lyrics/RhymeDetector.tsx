import { RhymeGroup } from './AILyricsAssistant';

interface PhoneticCache {
  [key: string]: string;
}

interface PhoneticAPI {
  getTranscription(word: string, language: string): string;
}

// Local JavaScript IPA transcription system
class PhoneticTranscriber implements PhoneticAPI {
  private cache: PhoneticCache = {};
  private readonly MAX_CACHE_SIZE = 1000;

  // Common Italian word endings to IPA mappings
  private italianIpaDict: { [key: string]: string } = {
    'male': 'ale',
    'irreale': 'eale',
    'finale': 'ale', 
    'reale': 'eale',
    'normale': 'ale',
    'generale': 'ale',
    'speciale': 'ale',
    'sociale': 'ale',
    'nazionale': 'ale',
    'regionale': 'ale',
    'personale': 'ale',
    'naturale': 'ale',
    'centrale': 'ale',
    'totale': 'ale',
    'vitale': 'ale',
    'locale': 'ale',
    'musicale': 'ale',
    'animale': 'ale',
    'mentale': 'ale',
    'fatale': 'ale'
  };

  getTranscription(word: string, language: string): string {
    const cacheKey = `${word}-${language}`;
    
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    let transcription = '';
    
    try {
      // Use local dictionaries and rules
      if (language === 'it') {
        transcription = this.getItalianIPA(word);
      } else if (language === 'en') {
        transcription = this.getEnglishIPA(word);
      } else {
        transcription = this.getGenericIPA(word, language);
      }
      
      // Validate and clean transcription
      transcription = this.validateAndClean(transcription, word, language);

      // Cache the result
      this.cacheTranscription(cacheKey, transcription);
      return transcription;
    } catch (error) {
      console.warn(`Phonetic transcription error for "${word}" (${language}):`, error);
      return this.getFallbackPhonetic(word, language);
    }
  }

  private getItalianIPA(word: string): string {
    // Check if word is in our dictionary
    if (this.italianIpaDict[word]) {
      return this.italianIpaDict[word];
    }

    // Apply Italian phonetic rules
    let ipa = word.toLowerCase();
    
    // Italian-specific IPA conversion rules focusing on rhyme endings
    const rules = [
      // Main rhyme endings
      [/ale$/, 'ale'],  // male, reale, finale
      [/are$/, 'are'],  // amare, cantare
      [/ere$/, 'ere'],  // vedere, credere
      [/ire$/, 'ire'],  // sentire, partire
      [/ore$/, 'ore'],  // amore, dolore
      [/ione$/, 'jone'], // azione, nazione
      [/zione$/, 'tsjone'], // protezione, creazione
      [/sione$/, 'sjone'], // dimensione, decisione
      [/mente$/, 'ente'], // certamente, rapidamente
      [/anza$/, 'antsa'], // speranza, danza
      [/enza$/, 'entsa'], // presenza, violenza
      [/ità$/, 'ita'],   // città, verità
      [/ezza$/, 'ettsa'], // bellezza, tristezza
    ];

    for (const [pattern, replacement] of rules) {
      if ((pattern as RegExp).test(ipa)) {
        ipa = ipa.replace(pattern as RegExp, replacement as string);
        break; // Use first match only
      }
    }

    // Return last 3 characters for rhyme matching
    return ipa.slice(-3);
  }

  private getEnglishIPA(word: string): string {
    // Basic English IPA conversion
    let ipa = word.toLowerCase();
    
    // English phonetic rules for common endings
    const rules = [
      [/tion$/, 'ʃən'],
      [/sion$/, 'ʒən'],
      [/ing$/, 'ɪŋ'],
      [/ed$/, 'd'],
      [/er$/, 'ər'],
      [/ly$/, 'li'],
      [/y$/, 'i'],
      [/ight$/, 'aɪt'],
      [/ough$/, 'ʌf'],
      [/augh$/, 'ɔːf']
    ];

    for (const [pattern, replacement] of rules) {
      if ((pattern as RegExp).test(ipa)) {
        ipa = ipa.replace(pattern as RegExp, replacement as string);
        break;
      }
    }

    return ipa.slice(-3);
  }

  private getGenericIPA(word: string, language: string): string {
    // Generic IPA approximation for other languages
    return this.getFallbackPhonetic(word, language);
  }

  private validateAndClean(transcription: string, word: string, language: string): string {
    if (!transcription) return this.getFallbackPhonetic(word, language);
    
    // Clean up common issues in IPA transcription
    let cleaned = transcription
      .replace(/[\/\[\]]/g, '') // Remove IPA delimiters
      .replace(/[ˈˌ]/g, '') // Remove stress markers for rhyme comparison
      .toLowerCase();
    
    return cleaned || this.getFallbackPhonetic(word, language);
  }

  private getFallbackPhonetic(word: string, language: string): string {
    // Enhanced fallback with better phonetic rules
    switch (language) {
      case 'en': return this.getEnglishPhoneticFallback(word);
      case 'it': return this.getItalianPhoneticFallback(word);
      case 'es': return this.getSpanishPhoneticFallback(word);
      case 'fr': return this.getFrenchPhoneticFallback(word);
      case 'de': return this.getGermanPhoneticFallback(word);
      default: return word.slice(-2);
    }
  }

  private getEnglishPhoneticFallback(word: string): string {
    let phonetic = word.toLowerCase();
    
    const rules = [
      [/tion$/, 'ʃən'],
      [/sion$/, 'ʒən'],
      [/ed$/, 't'],
      [/ing$/, 'ɪŋ'],
      [/ly$/, 'li'],
      [/y$/, 'i'],
      [/er$/, 'ər']
    ];

    for (const [pattern, replacement] of rules) {
      phonetic = phonetic.replace(pattern as RegExp, replacement as string);
    }

    return phonetic.slice(-3);
  }

  private getItalianPhoneticFallback(word: string): string {
    let phonetic = word.toLowerCase();
    
    const rules = [
      [/ale$/, 'ale'],
      [/are$/, 'are'],
      [/ere$/, 'ere'],
      [/ire$/, 'ire'],
      [/ore$/, 'ore'],
      [/zione$/, 'tsjone'],
      [/sione$/, 'sjone'],
      [/mente$/, 'ente'],
      [/ità$/, 'ita']
    ];

    for (const [pattern, replacement] of rules) {
      phonetic = phonetic.replace(pattern as RegExp, replacement as string);
    }

    return phonetic.slice(-3);
  }

  private getSpanishPhoneticFallback(word: string): string {
    let phonetic = word.toLowerCase();
    
    const rules = [
      [/ción$/, 'θjon'],
      [/sión$/, 'sjon'],
      [/mente$/, 'ente'],
      [/ando$/, 'ando'],
      [/ar$/, 'ar'],
      [/er$/, 'er'],
      [/ir$/, 'ir']
    ];

    for (const [pattern, replacement] of rules) {
      phonetic = phonetic.replace(pattern as RegExp, replacement as string);
    }

    return phonetic.slice(-3);
  }

  private getFrenchPhoneticFallback(word: string): string {
    let phonetic = word.toLowerCase();
    
    const rules = [
      [/tion$/, 'sjɔ̃'],
      [/sion$/, 'zjɔ̃'],
      [/ment$/, 'mɑ̃'],
      [/ent$/, 'ɑ̃'],
      [/age$/, 'aʒ'],
      [/eur$/, 'œr']
    ];

    for (const [pattern, replacement] of rules) {
      phonetic = phonetic.replace(pattern as RegExp, replacement as string);
    }

    return phonetic.slice(-3);
  }

  private getGermanPhoneticFallback(word: string): string {
    let phonetic = word.toLowerCase();
    
    const rules = [
      [/ung$/, 'ʊŋ'],
      [/heit$/, 'aɪt'],
      [/keit$/, 'aɪt'],
      [/lich$/, 'ɪç'],
      [/tion$/, 'oːn']
    ];

    for (const [pattern, replacement] of rules) {
      phonetic = phonetic.replace(pattern as RegExp, replacement as string);
    }

    return phonetic.slice(-3);
  }

  private cacheTranscription(key: string, value: string): void {
    if (Object.keys(this.cache).length >= this.MAX_CACHE_SIZE) {
      // Simple LRU: remove oldest entries
      const entries = Object.entries(this.cache);
      entries.slice(0, Math.floor(this.MAX_CACHE_SIZE / 2)).forEach(([k]) => {
        delete this.cache[k];
      });
    }
    this.cache[key] = value;
  }
}

export class RhymeDetector {
  private rhymeColors = [
    'hsl(var(--rhyme-1))',
    'hsl(var(--rhyme-2))',
    'hsl(var(--rhyme-3))',
    'hsl(var(--rhyme-4))',
    'hsl(var(--rhyme-5))',
  ];

  private phoneticAPI: PhoneticAPI;

  constructor() {
    this.phoneticAPI = new PhoneticTranscriber();
  }

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
    
    // Process all lines
    lines.forEach((line, lineIndex) => {
      const lineWords = line.trim().split(/\s+/);
      
      lineWords.forEach((word, wordIndex) => {
        const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
        if (cleanWord.length > 2) {
          const phonetic = this.phoneticAPI.getTranscription(cleanWord, language);
          const startChar = globalCharIndex + wordIndex * (word.length + 1);
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
      });

      globalCharIndex += line.length + 1; // +1 for newline
    });

    // Group words by phonetic similarity
    const phoneticGroups: { [key: string]: typeof words } = {};
    
    words.forEach(wordData => {
      // Extract rhyme part from phonetic transcription
      const rhymeKey = this.extractRhymeSound(wordData.phonetic, language);
      if (!phoneticGroups[rhymeKey]) {
        phoneticGroups[rhymeKey] = [];
      }
      phoneticGroups[rhymeKey].push(wordData);
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

    return rhymeGroups;
  }

  private extractRhymeSound(ipa: string, language: string): string {
    // Extract the rhyming part from phonetic transcription
    if (!ipa || ipa.length < 2) return ipa;
    
    // For Italian, we focus on endings which are very consistent
    if (language === 'it') {
      return ipa; // Already processed to be the rhyme ending
    }
    
    // For other languages, use last 2-3 characters
    return ipa.slice(-3);
  }

  private analyzeRhymeType(words: Array<{ word: string; phonetic: string }>): { 
    type: RhymeGroup['type']; 
    strength: number; 
  } {
    if (words.length < 2) return { type: 'near', strength: 0.5 };
    
    const phonetics = words.map(w => w.phonetic);
    const firstPhonetic = phonetics[0];
    
    // Perfect rhyme: identical phonetic endings
    const perfectMatch = phonetics.every(p => p === firstPhonetic);
    if (perfectMatch) {
      return { type: 'perfect', strength: 1.0 };
    }
    
    // Calculate similarity
    const similarity = this.calculatePhoneticSimilarity(phonetics);
    
    if (similarity > 0.8) {
      return { type: 'near', strength: similarity };
    } else if (similarity > 0.6) {
      return { type: 'slant', strength: similarity };
    }
    
    return { type: 'near', strength: similarity };
  }

  private calculatePhoneticSimilarity(phonetics: string[]): number {
    if (phonetics.length < 2) return 0;
    
    const first = phonetics[0];
    let totalSimilarity = 0;
    
    for (let i = 1; i < phonetics.length; i++) {
      const similarity = this.comparePhonetics(first, phonetics[i]);
      totalSimilarity += similarity;
    }
    
    return totalSimilarity / (phonetics.length - 1);
  }

  private comparePhonetics(a: string, b: string): number {
    if (a === b) return 1.0;
    
    const maxLen = Math.max(a.length, b.length);
    const minLen = Math.min(a.length, b.length);
    
    if (maxLen === 0) return 0;
    
    // Compare from the end (most important for rhyming)
    let matches = 0;
    for (let i = 0; i < minLen; i++) {
      const aChar = a[a.length - 1 - i];
      const bChar = b[b.length - 1 - i];
      
      if (aChar === bChar) {
        matches += 1;
      } else if (this.areSimilarPhonemes(aChar, bChar)) {
        matches += 0.5;
      }
    }
    
    return matches / maxLen;
  }

  private areSimilarPhonemes(a: string, b: string): boolean {
    // Group similar phonemes
    const similarGroups = [
      ['a', 'æ', 'ɑ'],
      ['e', 'ɛ', 'ə'],
      ['i', 'ɪ', 'ɨ'],
      ['o', 'ɔ', 'ɵ'],
      ['u', 'ʊ', 'ʉ'],
      ['p', 'b'],
      ['t', 'd'],
      ['k', 'g'],
      ['f', 'v'],
      ['s', 'z'],
      ['ʃ', 'ʒ'],
      ['θ', 'ð'],
      ['m', 'n', 'ŋ'],
      ['l', 'r', 'ɾ']
    ];
    
    return similarGroups.some(group => 
      group.includes(a) && group.includes(b)
    );
  }
}