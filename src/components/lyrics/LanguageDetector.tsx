export class LanguageDetector {
  private languagePatterns = {
    en: {
      commonWords: ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
      patterns: [/\b(ing|ed|ly|tion|sion)\b/gi, /\b(a|an|the)\s+\w+/gi],
      vowelRatio: 0.4
    },
    es: {
      commonWords: ['el', 'la', 'los', 'las', 'de', 'del', 'y', 'o', 'en', 'con', 'por', 'para'],
      patterns: [/\b(ción|sión|mente|ando|iendo)\b/gi, /\b(el|la|los|las)\s+\w+/gi],
      vowelRatio: 0.5
    },
    fr: {
      commonWords: ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'dans', 'avec', 'pour', 'par'],
      patterns: [/\b(tion|sion|ment|age|eur)\b/gi, /\b(le|la|les|des)\s+\w+/gi],
      vowelRatio: 0.45
    },
    it: {
      commonWords: ['il', 'la', 'i', 'le', 'di', 'da', 'del', 'e', 'o', 'in', 'con', 'per'],
      patterns: [/\b(zione|mente|ando|endo)\b/gi, /\b(il|la|gli|le)\s+\w+/gi],
      vowelRatio: 0.5
    },
    de: {
      commonWords: ['der', 'die', 'das', 'den', 'dem', 'des', 'und', 'oder', 'in', 'mit', 'für', 'von'],
      patterns: [/\b(ung|keit|heit|lich|isch)\b/gi, /\b(der|die|das|den)\s+\w+/gi],
      vowelRatio: 0.35
    },
    pt: {
      commonWords: ['o', 'a', 'os', 'as', 'de', 'da', 'do', 'e', 'ou', 'em', 'com', 'para'],
      patterns: [/\b(ção|são|mente|ando|endo)\b/gi, /\b(o|a|os|as)\s+\w+/gi],
      vowelRatio: 0.5
    }
  };

  async detectLanguage(text: string): Promise<string> {
    if (!text.trim()) {
      return 'en'; // default
    }

    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    const words = cleanText.split(/\s+/).filter(word => word.length > 1);
    
    if (words.length === 0) {
      return 'en';
    }

    const scores: { [language: string]: number } = {};

    // Calculate scores for each language
    Object.entries(this.languagePatterns).forEach(([lang, patterns]) => {
      scores[lang] = this.calculateLanguageScore(cleanText, words, patterns);
    });

    // Find the language with the highest score
    const detectedLanguage = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    )[0];

    return detectedLanguage;
  }

  private calculateLanguageScore(
    text: string, 
    words: string[], 
    patterns: typeof this.languagePatterns.en
  ): number {
    let score = 0;

    // Check for common words
    const commonWordMatches = words.filter(word => 
      patterns.commonWords.includes(word)
    ).length;
    score += (commonWordMatches / words.length) * 40;

    // Check for language-specific patterns
    patterns.patterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      score += (matches.length / words.length) * 30;
    });

    // Check vowel ratio
    const vowels = text.match(/[aeiou]/g) || [];
    const consonants = text.match(/[bcdfghjklmnpqrstvwxyz]/g) || [];
    const actualVowelRatio = vowels.length / (vowels.length + consonants.length);
    const expectedRatio = patterns.vowelRatio;
    const ratioScore = 1 - Math.abs(actualVowelRatio - expectedRatio);
    score += ratioScore * 30;

    return score;
  }

  getLanguageName(code: string): string {
    const names: { [key: string]: string } = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      it: 'Italian',
      de: 'German',
      pt: 'Portuguese'
    };
    return names[code] || 'Unknown';
  }

  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return Object.keys(this.languagePatterns).map(code => ({
      code,
      name: this.getLanguageName(code)
    }));
  }
}