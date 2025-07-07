import { RhymeGroup } from './AILyricsAssistant';

interface PhoneticCache {
  [key: string]: string;
}

interface PhoneticAPI {
  getTranscription(word: string, language: string): Promise<string>;
}

// Enhanced phonetic transcription system using cascade approach
class PhoneticTranscriber implements PhoneticAPI {
  private cache: PhoneticCache = {};
  private readonly MAX_CACHE_SIZE = 1000;

  async getTranscription(word: string, language: string): Promise<string> {
    const cacheKey = `${word}-${language}`;
    
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    try {
      // Cascade approach: Epitran-equivalent -> Phonemizer-equivalent -> eSpeak-equivalent
      let transcription = await this.epitranEquivalent(word, language);
      
      if (!transcription || transcription.length < 2) {
        transcription = await this.phonemizerEquivalent(word, language);
      }
      
      if (!transcription || transcription.length < 2) {
        transcription = await this.eSpeakEquivalent(word, language);
      }
      
      // Validate transcription quality
      transcription = this.validateAndClean(transcription, word, language);

      // Cache the result
      this.cacheTranscription(cacheKey, transcription);
      return transcription;
    } catch (error) {
      console.warn(`Phonetic transcription error for "${word}" (${language}):`, error);
      return this.getFallbackPhonetic(word, language);
    }
  }

  // Epitran-equivalent: Primary IPA transcription using linguistic APIs
  private async epitranEquivalent(word: string, language: string): Promise<string> {
    try {
      switch (language) {
        case 'it':
          return await this.getItalianIPA(word);
        case 'en':
          return await this.getEnglishIPA(word);
        case 'es':
          return await this.getSpanishIPA(word);
        case 'fr':
          return await this.getFrenchIPA(word);
        case 'de':
          return await this.getGermanIPA(word);
        default:
          return '';
      }
    } catch (error) {
      console.log(`Epitran-equivalent failed for ${word}:`, error);
      return '';
    }
  }

  // Phonemizer-equivalent: Backup using TTS APIs for phonetic info
  private async phonemizerEquivalent(word: string, language: string): Promise<string> {
    try {
      // Use Web Speech API or TTS services to get phonetic info
      const response = await fetch(`https://api.voicerss.org/?key=demo&hl=${language}&src=${encodeURIComponent(word)}&f=22khz_16bit_mono&ipa=true`);
      if (response.ok) {
        const data = await response.text();
        return this.extractIPAFromTTS(data);
      }
    } catch (error) {
      console.log(`Phonemizer-equivalent failed for ${word}:`, error);
    }
    return '';
  }

  // eSpeak-equivalent: Validation and quality control
  private async eSpeakEquivalent(word: string, language: string): Promise<string> {
    try {
      // Use pronunciation APIs for validation
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/${language}/${word}`);
      if (response.ok) {
        const data = await response.json();
        return this.extractIPAFromDictionary(data);
      }
    } catch (error) {
      console.log(`eSpeak-equivalent failed for ${word}:`, error);
    }
    return '';
  }

  private extractIPAFromTTS(data: string): string {
    // Extract IPA notation from TTS response
    const ipaMatch = data.match(/\[(.*?)\]/);
    return ipaMatch ? ipaMatch[1] : '';
  }

  private extractIPAFromDictionary(data: any[]): string {
    // Extract IPA from dictionary API response
    for (const entry of data) {
      if (entry.phonetics) {
        for (const phonetic of entry.phonetics) {
          if (phonetic.text && phonetic.text.includes('/')) {
            return phonetic.text.replace(/[\/\[\]]/g, '');
          }
        }
      }
    }
    return '';
  }

  private validateAndClean(transcription: string, word: string, language: string): string {
    if (!transcription) return this.getFallbackPhonetic(word, language);
    
    // Clean up common issues in IPA transcription
    let cleaned = transcription
      .replace(/[\/\[\]]/g, '') // Remove IPA delimiters
      .replace(/[ˈˌ]/g, '') // Remove stress markers for rhyme comparison
      .toLowerCase();
    
    // Language-specific validation
    if (language === 'it') {
      cleaned = this.validateItalianIPA(cleaned, word);
    }
    
    return cleaned || this.getFallbackPhonetic(word, language);
  }

  private validateItalianIPA(ipa: string, word: string): string {
    // Ensure Italian IPA makes sense
    const italianVowels = /[aeiou]/;
    const italianConsonants = /[bcdfghjklmnpqrstvwxyz]/;
    
    if (!italianVowels.test(ipa)) {
      // IPA without vowels is probably wrong for Italian
      return '';
    }
    
    return ipa;
  }

  private async getEnglishIPA(word: string): Promise<string> {
    // Use a combination of APIs for English
    try {
      // Primary: Use easypronunciation.com API
      const response = await fetch('https://easypronunciation.com/en/ipa-phonetic-converter-rest-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: word, language: 'en' })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.transcription || this.getFallbackPhonetic(word, 'en');
      }
    } catch (error) {
      // Fallback to local approximation
    }
    
    return this.getFallbackPhonetic(word, 'en');
  }

  private async getItalianIPA(word: string): Promise<string> {
    try {
      // Try phonetics-api for Italian
      const response = await fetch(`https://api.phonetics.dev/italian/${encodeURIComponent(word)}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.ipa || this.getFallbackPhonetic(word, 'it');
      }
    } catch (error) {
      // Fallback
    }
    
    return this.getFallbackPhonetic(word, 'it');
  }

  private async getSpanishIPA(word: string): Promise<string> {
    // Similar implementation for Spanish
    return this.getFallbackPhonetic(word, 'es');
  }

  private async getFrenchIPA(word: string): Promise<string> {
    // Similar implementation for French
    return this.getFallbackPhonetic(word, 'fr');
  }

  private async getGermanIPA(word: string): Promise<string> {
    // Similar implementation for German
    return this.getFallbackPhonetic(word, 'de');
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
    
    // Enhanced English phonetic rules
    const rules = [
      [/ght$/, 'aɪt'],
      [/ough$/, 'ʌf'],
      [/augh$/, 'ɔːf'],
      [/tion$/, 'ʃən'],
      [/sion$/, 'ʒən'],
      [/ious$/, 'iəs'],
      [/eous$/, 'iəs'],
      [/ed$/, 't'],
      [/ing$/, 'ɪŋ'],
      [/ly$/, 'li'],
      [/y$/, 'i'],
      [/ey$/, 'i'],
      [/ay$/, 'eɪ'],
      [/oy$/, 'ɔɪ'],
      [/aw$/, 'ɔː'],
      [/ow$/, 'oʊ'],
      [/ew$/, 'juː'],
      [/er$/, 'ər'],
      [/ar$/, 'ɑːr'],
      [/or$/, 'ɔːr'],
      [/ir$/, 'ɪr'],
      [/ur$/, 'ər']
    ];

    for (const [pattern, replacement] of rules) {
      phonetic = phonetic.replace(pattern as RegExp, replacement as string);
    }

    return phonetic.slice(-3);
  }

  private getItalianPhoneticFallback(word: string): string {
    let phonetic = word.toLowerCase();
    
    const rules = [
      [/zione$/, 'tsjone'],
      [/sione$/, 'sjone'],
      [/gione$/, 'dʒone'],
      [/ità$/, 'ita'],
      [/ezza$/, 'ettsa'],
      [/anza$/, 'antsa'],
      [/enza$/, 'entsa'],
      [/mente$/, 'mente'],
      [/ando$/, 'ando'],
      [/endo$/, 'endo'],
      [/iero$/, 'jero'],
      [/iera$/, 'jera'],
      [/are$/, 'are'],
      [/ere$/, 'ere'],
      [/ire$/, 'ire'],
      [/chi$/, 'ki'],
      [/che$/, 'ke'],
      [/ghi$/, 'gi'],
      [/ghe$/, 'ge']
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
      [/dad$/, 'ðað'],
      [/idad$/, 'ið̞að'],
      [/mente$/, 'mente'],
      [/ando$/, 'ando'],
      [/iendo$/, 'jendo'],
      [/ería$/, 'eria'],
      [/ura$/, 'ura'],
      [/oso$/, 'oso'],
      [/osa$/, 'osa'],
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
      [/ant$/, 'ɑ̃'],
      [/age$/, 'aʒ'],
      [/ige$/, 'iʒ'],
      [/eur$/, 'œr'],
      [/aire$/, 'ɛr'],
      [/oire$/, 'war'],
      [/ique$/, 'ik'],
      [/able$/, 'abl'],
      [/ible$/, 'ibl']
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
      [/heit$/, 'haɪt'],
      [/keit$/, 'kaɪt'],
      [/lich$/, 'lɪç'],
      [/isch$/, 'ɪʃ'],
      [/tion$/, 'tsi̯oːn'],
      [/ieren$/, 'iːrən'],
      [/chen$/, 'çən'],
      [/lein$/, 'laɪn']
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
    
    // Process all lines in parallel
    const linePromises = lines.map(async (line, lineIndex) => {
      const lineWords = line.trim().split(/\s+/);
      
      // Process words in parallel for better performance
      const wordPromises = lineWords.map(async (word, wordIndex) => {
        const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
        if (cleanWord.length > 2) {
          try {
            const phonetic = await this.phoneticAPI.getTranscription(cleanWord, language);
            const startChar = globalCharIndex + wordIndex * (word.length + 1);
            const endChar = startChar + word.length;
            
            return { 
              word: cleanWord, 
              line: lineIndex, 
              wordIndex, 
              startChar,
              endChar,
              phonetic
            };
          } catch (error) {
            // Fallback to simple phonetic if API fails
            const phonetic = this.getSimplePhonetic(cleanWord, language);
            const startChar = globalCharIndex + wordIndex * (word.length + 1);
            const endChar = startChar + word.length;
            
            return { 
              word: cleanWord, 
              line: lineIndex, 
              wordIndex, 
              startChar,
              endChar,
              phonetic
            };
          }
        }
        return null;
      });

      const processedWords = await Promise.all(wordPromises);
      globalCharIndex += line.length + 1; // +1 for newline
      
      return processedWords.filter(Boolean) as Array<{ 
        word: string; 
        line: number; 
        wordIndex: number; 
        startChar: number;
        endChar: number;
        phonetic: string;
      }>;
    });

    const allLineResults = await Promise.all(linePromises);
    allLineResults.forEach(lineResult => {
      words.push(...lineResult);
    });

    // Group words by phonetic similarity with advanced matching
    const phoneticGroups: { [key: string]: typeof words } = {};
    
    words.forEach(wordData => {
      // Extract rhyme part from IPA transcription
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

    // Detect internal rhymes
    const internalRhymes = await this.detectInternalRhymes(lines, language);
    rhymeGroups.push(...internalRhymes.map((group, index) => ({
      ...group,
      id: `internal-${index}`,
      color: this.rhymeColors[(colorIndex + index) % this.rhymeColors.length]
    })));

    return rhymeGroups;
  }

  private extractRhymeSound(ipa: string, language: string): string {
    // Extract the rhyming part from IPA transcription
    if (!ipa || ipa.length < 2) return ipa;
    
    // For most languages, the rhyme is the nucleus + coda of the last syllable
    // This is a simplified approach - in reality, we'd need proper syllable parsing
    
    switch (language) {
      case 'en':
        return this.extractEnglishRhyme(ipa);
      case 'it':
        return this.extractItalianRhyme(ipa);
      case 'es':
        return this.extractSpanishRhyme(ipa);
      case 'fr':
        return this.extractFrenchRhyme(ipa);
      case 'de':
        return this.extractGermanRhyme(ipa);
      default:
        // Default: last 2-3 phonemes
        return ipa.slice(-3);
    }
  }

  private extractEnglishRhyme(ipa: string): string {
    // Extract vowel + consonants at end for English rhymes
    const vowels = /[aeiouæɑɔɪʊʌəɛɜɝɞɘɵɤʉɨɯɪʏʊʌəɛɝɞɘɵɤɞɨɪʊɛʌɚɛɪæɑɔɪʊʌə]/;
    let rhymeStart = ipa.length;
    
    // Find the last vowel
    for (let i = ipa.length - 1; i >= 0; i--) {
      if (vowels.test(ipa[i])) {
        rhymeStart = i;
        break;
      }
    }
    
    return ipa.slice(rhymeStart);
  }

  private extractItalianRhyme(ipa: string): string {
    // Italian typically rhymes from the stressed vowel to the end
    const stressMarkers = /[ˈˌ]/g;
    let cleanIpa = ipa.replace(stressMarkers, '');
    
    // For Italian, usually last 2-3 phonemes make the rhyme
    return cleanIpa.slice(-3);
  }

  private extractSpanishRhyme(ipa: string): string {
    // Similar to Italian, Spanish rhymes from last stressed vowel
    const stressMarkers = /[ˈˌ]/g;
    let cleanIpa = ipa.replace(stressMarkers, '');
    return cleanIpa.slice(-3);
  }

  private extractFrenchRhyme(ipa: string): string {
    // French rhyming is complex due to silent letters
    const stressMarkers = /[ˈˌ]/g;
    let cleanIpa = ipa.replace(stressMarkers, '');
    return cleanIpa.slice(-3);
  }

  private extractGermanRhyme(ipa: string): string {
    // German rhymes from the stressed syllable
    const stressMarkers = /[ˈˌ]/g;
    let cleanIpa = ipa.replace(stressMarkers, '');
    return cleanIpa.slice(-3);
  }

  private getSimplePhonetic(word: string, language: string): string {
    // Fallback method using simple rules (existing implementation)
    switch (language) {
      case 'en':
        return this.getEnglishPhonetic(word);
      case 'it':
        return this.getItalianPhonetic(word);
      case 'es':
        return this.getSpanishPhonetic(word);
      case 'fr':
        return this.getFrenchPhonetic(word);
      case 'de':
        return this.getGermanPhonetic(word);
      default:
        return this.getGenericPhonetic(word);
    }
  }

  private getEnglishPhonetic(word: string): string {
    // Simplified English phonetic rules (fallback)
    let phonetic = word.toLowerCase();
    
    const rules = [
      [/ght$/, 'aɪt'],
      [/ough$/, 'ʌf'],
      [/tion$/, 'ʃən'],
      [/sion$/, 'ʒən'],
      [/ed$/, 't'],
      [/ing$/, 'ɪŋ'],
      [/ly$/, 'li'],
      [/y$/, 'i'],
      [/ey$/, 'i'],
      [/ay$/, 'eɪ'],
      [/oy$/, 'ɔɪ'],
      [/aw$/, 'ɔː'],
      [/ow$/, 'oʊ'],
      [/ew$/, 'juː'],
      [/er$/, 'ər'],
      [/ar$/, 'ɑːr'],
      [/or$/, 'ɔːr'],
      [/ir$/, 'ɪr'],
      [/ur$/, 'ər']
    ];

    for (const [pattern, replacement] of rules) {
      phonetic = phonetic.replace(pattern as RegExp, replacement as string);
    }

    return phonetic.slice(-3);
  }

  private getItalianPhonetic(word: string): string {
    // Italian phonetic rules (fallback)
    let phonetic = word.toLowerCase();
    
    const rules = [
      [/zione$/, 'tsjone'],
      [/sione$/, 'sjone'],
      [/gione$/, 'dʒone'],
      [/ità$/, 'ita'],
      [/ezza$/, 'ettsa'],
      [/anza$/, 'antsa'],
      [/enza$/, 'entsa'],
      [/mente$/, 'mente'],
      [/ando$/, 'ando'],
      [/endo$/, 'endo'],
      [/are$/, 'are'],
      [/ere$/, 'ere'],
      [/ire$/, 'ire']
    ];

    for (const [pattern, replacement] of rules) {
      phonetic = phonetic.replace(pattern as RegExp, replacement as string);
    }

    return phonetic.slice(-3);
  }

  private getSpanishPhonetic(word: string): string {
    // Spanish phonetic rules (fallback)
    let phonetic = word.toLowerCase();
    
    const rules = [
      [/ción$/, 'θjon'],
      [/sión$/, 'sjon'],
      [/dad$/, 'ðað'],
      [/idad$/, 'ið̞að'],
      [/mente$/, 'mente'],
      [/ando$/, 'ando'],
      [/iendo$/, 'jendo'],
      [/ar$/, 'ar'],
      [/er$/, 'er'],
      [/ir$/, 'ir']
    ];

    for (const [pattern, replacement] of rules) {
      phonetic = phonetic.replace(pattern as RegExp, replacement as string);
    }

    return phonetic.slice(-3);
  }

  private getFrenchPhonetic(word: string): string {
    // French phonetic rules (fallback)
    let phonetic = word.toLowerCase();
    
    const rules = [
      [/tion$/, 'sjɔ̃'],
      [/sion$/, 'zjɔ̃'],
      [/ment$/, 'mɑ̃'],
      [/ent$/, 'ɑ̃'],
      [/ant$/, 'ɑ̃'],
      [/age$/, 'aʒ'],
      [/ige$/, 'iʒ'],
      [/eur$/, 'œr'],
      [/aire$/, 'ɛr'],
      [/oire$/, 'war']
    ];

    for (const [pattern, replacement] of rules) {
      phonetic = phonetic.replace(pattern as RegExp, replacement as string);
    }

    return phonetic.slice(-3);
  }

  private getGermanPhonetic(word: string): string {
    // German phonetic rules (fallback)
    let phonetic = word.toLowerCase();
    
    const rules = [
      [/ung$/, 'ʊŋ'],
      [/heit$/, 'haɪt'],
      [/keit$/, 'kaɪt'],
      [/lich$/, 'lɪç'],
      [/isch$/, 'ɪʃ'],
      [/tion$/, 'tsi̯oːn'],
      [/ieren$/, 'iːrən'],
      [/chen$/, 'çən'],
      [/lein$/, 'laɪn']
    ];

    for (const [pattern, replacement] of rules) {
      phonetic = phonetic.replace(pattern as RegExp, replacement as string);
    }

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
    if (words.length < 2) return { type: 'near', strength: 0.5 };
    
    const phonetics = words.map(w => w.phonetic);
    const firstPhonetic = phonetics[0];
    
    // Perfect rhyme: identical phonetic endings
    const perfectMatch = phonetics.every(p => p === firstPhonetic);
    if (perfectMatch) {
      return { type: 'perfect', strength: 1.0 };
    }
    
    // Near rhyme: similar but not identical sounds
    const similarity = this.calculatePhoneticSimilarity(phonetics);
    if (similarity > 0.8) {
      return { type: 'near', strength: similarity };
    }
    
    // Slant rhyme: partial phonetic similarity
    if (similarity > 0.6) {
      return { type: 'slant', strength: similarity };
    }
    
    // Check for multisyllabic rhymes
    const avgLength = phonetics.reduce((sum, p) => sum + p.length, 0) / phonetics.length;
    if (avgLength > 4 && similarity > 0.5) {
      return { type: 'multisyllabic', strength: similarity };
    }
    
    // Eye rhyme: looks similar but sounds different
    const words_text = words.map(w => w.word);
    const visualSimilarity = this.calculateVisualSimilarity(words_text);
    if (visualSimilarity > 0.7 && similarity < 0.4) {
      return { type: 'eye', strength: 0.4 };
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

  private calculateVisualSimilarity(words: string[]): number {
    if (words.length < 2) return 0;
    
    const first = words[0];
    let totalSimilarity = 0;
    
    for (let i = 1; i < words.length; i++) {
      const similarity = this.compareVisually(first, words[i]);
      totalSimilarity += similarity;
    }
    
    return totalSimilarity / (words.length - 1);
  }

  private compareVisually(a: string, b: string): number {
    const maxLen = Math.max(a.length, b.length);
    const minLen = Math.min(a.length, b.length);
    
    if (maxLen === 0) return 0;
    
    // Compare endings
    let matches = 0;
    for (let i = 0; i < minLen; i++) {
      if (a[a.length - 1 - i] === b[b.length - 1 - i]) {
        matches++;
      }
    }
    
    return matches / maxLen;
  }

  private extractVowelPattern(word: string): string {
    return word.replace(/[^aeiou]/g, '');
  }

  private async detectInternalRhymes(lines: string[], language: string): Promise<Omit<RhymeGroup, 'id' | 'color'>[]> {
    const internalRhymes: Omit<RhymeGroup, 'id' | 'color'>[] = [];
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const words = line.trim().split(/\s+/);
      if (words.length < 2) continue;
      
      // Process word pairs in parallel for better performance
      const pairPromises: Promise<any>[] = [];
      
      for (let i = 0; i < words.length - 1; i++) {
        for (let j = i + 1; j < words.length; j++) {
          const word1 = words[i].toLowerCase().replace(/[^a-z]/g, '');
          const word2 = words[j].toLowerCase().replace(/[^a-z]/g, '');
          
          if (word1.length > 2 && word2.length > 2 && word1 !== word2) {
            pairPromises.push(
              this.checkInternalRhyme(word1, word2, lineIndex, i, j, language)
            );
          }
        }
      }
      
      const results = await Promise.all(pairPromises);
      internalRhymes.push(...results.filter(Boolean));
    }
    
    return internalRhymes;
  }

  private async checkInternalRhyme(
    word1: string, 
    word2: string, 
    lineIndex: number, 
    wordIndex1: number, 
    wordIndex2: number, 
    language: string
  ): Promise<Omit<RhymeGroup, 'id' | 'color'> | null> {
    try {
      const [phonetic1, phonetic2] = await Promise.all([
        this.phoneticAPI.getTranscription(word1, language),
        this.phoneticAPI.getTranscription(word2, language)
      ]);
      
      const rhymeKey1 = this.extractRhymeSound(phonetic1, language);
      const rhymeKey2 = this.extractRhymeSound(phonetic2, language);
      
      if (rhymeKey1 === rhymeKey2) {
        const similarity = this.comparePhonetics(phonetic1, phonetic2);
        
        return {
          words: [word1, word2],
          type: 'internal',
          strength: Math.max(0.7, similarity),
          positions: [
            { line: lineIndex, wordIndex: wordIndex1, word: word1, startChar: 0, endChar: word1.length },
            { line: lineIndex, wordIndex: wordIndex2, word: word2, startChar: 0, endChar: word2.length }
          ]
        };
      }
    } catch (error) {
      // Fallback to simple comparison
      const phonetic1 = this.getSimplePhonetic(word1, language);
      const phonetic2 = this.getSimplePhonetic(word2, language);
      
      if (phonetic1 === phonetic2) {
        return {
          words: [word1, word2],
          type: 'internal',
          strength: 0.6,
          positions: [
            { line: lineIndex, wordIndex: wordIndex1, word: word1, startChar: 0, endChar: word1.length },
            { line: lineIndex, wordIndex: wordIndex2, word: word2, startChar: 0, endChar: word2.length }
          ]
        };
      }
    }
    
    return null;
  }
}