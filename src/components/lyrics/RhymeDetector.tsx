import { RhymeGroup } from './AILyricsAssistant';

// Import IPA libraries with proper fallbacks
let textToIPA: any = null;
let ipaDict: any = null;

try {
  textToIPA = require('text-to-ipa');
} catch (e) {
  console.warn('text-to-ipa library not available, using fallback');
}

try {
  ipaDict = require('ipa-dict');
} catch (e) {
  console.warn('ipa-dict library not available, using fallback');
}

interface PhoneticCache {
  [key: string]: string;
}

interface PhoneticAPI {
  getTranscription(word: string, language: string): string;
  extractStressTail(ipaWord: string): string;
}

// Advanced IPA-based phonetic transcription system
class AdvancedPhoneticTranscriber implements PhoneticAPI {
  private cache: PhoneticCache = {};
  private readonly MAX_CACHE_SIZE = 1000;

  getTranscription(word: string, language: string): string {
    const cacheKey = `${word}-${language}`;
    
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    let transcription = '';
    
    try {
      // Use actual IPA libraries for authentic conversion
      if (language === 'en') {
        transcription = this.getEnglishIPA(word);
      } else if (language === 'it') {
        transcription = this.getItalianIPA(word);
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
      return '';
    }
  }

  private getEnglishIPA(word: string): string {
    try {
      // Use ONLY text-to-ipa library for authentic English IPA conversion
      if (textToIPA && textToIPA.lookup) {
        const ipaResult = textToIPA.lookup(word.toLowerCase());
        
        console.log(`🔍 English IPA for "${word}": library result = "${ipaResult}"`);
        
        if (ipaResult && ipaResult.length > 0) {
          // Extract stress tail from IPA transcription
          const stressTail = this.extractStressTail(ipaResult);
          console.log(`🎵 English stress tail for "${word}": "${stressTail}"`);
          return stressTail;
        }
      }
      
      console.log(`❌ No English IPA found for "${word}" - returning empty`);
      return ''; // NO FALLBACK - return empty if library doesn't have the word
    } catch (error) {
      console.warn(`English IPA conversion failed for "${word}":`, error);
      return ''; // NO FALLBACK - return empty on error
    }
  }


  private getItalianIPA(word: string): string {
    try {
      // Use ONLY ipa-dict library for authentic Italian IPA conversion
      if (ipaDict && ipaDict.lookup) {
        const ipaResult = ipaDict.lookup(word.toLowerCase(), 'it');
        
        console.log(`🔍 Italian IPA for "${word}": library result = "${ipaResult}"`);
        
        if (ipaResult && ipaResult.length > 0) {
          // Extract stress tail from IPA transcription
          const stressTail = this.extractStressTail(ipaResult);
          console.log(`🎵 Italian stress tail for "${word}": "${stressTail}"`);
          return stressTail;
        }
      }
      
      console.log(`❌ No Italian IPA found for "${word}" - returning empty`);
      return ''; // NO FALLBACK - return empty if library doesn't have the word
    } catch (error) {
      console.warn(`Italian IPA conversion failed for "${word}":`, error);
      return ''; // NO FALLBACK - return empty on error
    }
  }

  private getGenericIPA(word: string, language: string): string {
    try {
      // Try ipa-dict for other languages
      const ipaResult = ipaDict.lookup(word.toLowerCase(), language);
      
      if (ipaResult && ipaResult.length > 0) {
        return this.extractStressTail(ipaResult);
      }
      
      return '';
    } catch (error) {
      return '';
    }
  }

  extractStressTail(ipaWord: string): string {
    if (!ipaWord || ipaWord.length === 0) return '';
    
    // Clean IPA string
    let cleanIPA = ipaWord
      .replace(/[\/\[\]]/g, '') // Remove IPA delimiters
      .replace(/[ˈˌ]/g, '')     // Remove stress markers for now
      .toLowerCase();
    
    // For syllable extraction, we need to identify the primary stress position
    // This is a simplified approach - extract last 2-4 phonemes as rhyme tail
    const phonemes = cleanIPA.split('');
    
    // Extract stress tail (last 2-4 characters for rhyming)
    const tailLength = Math.min(4, Math.max(2, phonemes.length));
    const stressTail = phonemes.slice(-tailLength).join('');
    
    return stressTail;
  }

  private validateAndClean(transcription: string, word: string, language: string): string {
    if (!transcription || transcription.length === 0) return '';
    
    // Additional validation - ensure it's not just the original word
    if (transcription === word.toLowerCase()) return '';
    
    // Clean and normalize
    let cleaned = transcription
      .replace(/[\/\[\]]/g, '') // Remove IPA delimiters
      .replace(/[ˈˌ]/g, '')     // Remove stress markers
      .toLowerCase()
      .trim();
    
    return cleaned.length >= 2 ? cleaned : '';
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
    this.phoneticAPI = new AdvancedPhoneticTranscriber();
  }

  private isValidIpaTranscription(phonetic: string, word: string, language: string): boolean {
    // Strict validation - only accept genuine IPA transcriptions from libraries
    if (!phonetic || phonetic.length === 0) {
      console.log(`❌ Invalid IPA for "${word}": empty phonetic`);
      return false;
    }
    
    // Reject if phonetic is just the original word
    if (phonetic === word.toLowerCase()) {
      console.log(`❌ Invalid IPA for "${word}": phonetic equals original word`);
      return false;
    }
    
    // Must be at least 2 characters and different from word ending
    if (phonetic.length < 2) {
      console.log(`❌ Invalid IPA for "${word}": too short (${phonetic.length})`);
      return false;
    }
    
    console.log(`✅ Valid IPA for "${word}": "${phonetic}"`);
    return true;
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
          
          console.log(`🔍 Debug word "${cleanWord}":`, {
            originalWord: word,
            phonetic: phonetic,
            isValid: phonetic && phonetic.length > 0 && this.isValidIpaTranscription(phonetic, cleanWord, language)
          });
          
          // Only add words that have a valid IPA transcription (not empty and not from fallback)
          if (phonetic && phonetic.length > 0 && this.isValidIpaTranscription(phonetic, cleanWord, language)) {
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
        }
      });

      globalCharIndex += line.length + 1; // +1 for newline
    });

    console.log('🎵 Rhyme Detection Debug:', {
      totalWords: words.length,
      wordsWithPhonetics: words.map(w => ({ word: w.word, phonetic: w.phonetic }))
    });

    // Group words by exact phonetic match
    const phoneticGroups: { [key: string]: typeof words } = {};
    
    words.forEach(wordData => {
      const rhymeKey = wordData.phonetic; // Use exact phonetic for stricter matching
      if (!phoneticGroups[rhymeKey]) {
        phoneticGroups[rhymeKey] = [];
      }
      phoneticGroups[rhymeKey].push(wordData);
    });

    console.log('🎵 Phonetic Groups:', Object.entries(phoneticGroups).map(([key, words]) => ({
      phonetic: key,
      words: words.map(w => w.word),
      count: words.length
    })));

    // Create rhyme groups - only for groups with 2+ words and valid rhyme patterns
    const rhymeGroups: RhymeGroup[] = [];
    let colorIndex = 0;

    Object.entries(phoneticGroups).forEach(([phonetic, groupWords]) => {
      // More strict validation: must have 2+ words and valid rhyme ending
      if (groupWords.length >= 2 && this.isValidRhymeGroup(groupWords, language)) {
        const { type, strength } = this.analyzeRhymeType(groupWords);
        
        // Only include groups with high confidence
        if (strength >= 0.8) {
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
      }
    });

    console.log('🎵 Final Rhyme Groups:', rhymeGroups.map(g => ({
      words: g.words,
      type: g.type,
      strength: g.strength
    })));

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

  private isValidRhymeGroup(words: Array<{ word: string; phonetic: string }>, language: string): boolean {
    if (words.length < 2) return false;
    
    // All words in the group must have identical phonetic transcriptions for true rhymes
    const firstPhonetic = words[0].phonetic;
    const allMatch = words.every(w => w.phonetic === firstPhonetic);
    
    console.log(`🎵 Validating rhyme group for "${words.map(w => w.word).join(', ')}" with phonetic "${firstPhonetic}": ${allMatch ? 'VALID' : 'INVALID'}`);
    
    return allMatch;
  }
}