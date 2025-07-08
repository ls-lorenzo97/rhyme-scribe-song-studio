import { RhymeGroup } from './AILyricsAssistant';

// Import IPA library with fallback
let textToIPA: any = null;

try {
  textToIPA = require('text-to-ipa');
} catch (e) {
  console.warn('text-to-ipa library not available');
}

export class RhymeDetector {
  // Phase 5: Optimized color palette for visual distinction
  private rhymeColors = [
    '#FF6B6B',  // Rosso corallo
    '#4ECDC4',  // Turchese  
    '#45B7D1',  // Blu cielo
    '#96CEB4',  // Verde menta
    '#FFEAA7',  // Giallo pastello
    '#DDA0DD',  // Prugna
    '#FFB3BA',  // Rosa chiaro
    '#BAFFC9',  // Verde chiaro
    '#BAE1FF',  // Azzurro chiaro
    '#FFFFBA',  // Giallo chiaro
    '#FFD1B3',  // Arancione chiaro
    '#E1BAFF',  // Viola chiaro
    '#FFB3F0',  // Magenta chiaro
    '#B3FFDA',  // Acquamarina
    '#D1FFB3'   // Verde lime
  ];

  // Italian-specific vowel mapping for phonetic analysis
  private vowelMap = {
    'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u',
    'à': 'a', 'è': 'ɛ', 'é': 'e', 'ì': 'i', 'ò': 'ɔ', 'ó': 'o', 'ù': 'u'
  };

  // Common Italian suffixes that should be penalized
  private irrelevantSuffixes = [
    'mente', 'zione', 'sione', 'amento', 'imento',
    'abile', 'ibile', 'evole', 'ando', 'endo', 'ante', 'ente'
  ];

  // Italian function words to exclude
  private functionWords = [
    'il', 'la', 'lo', 'gli', 'le', 'un', 'una', 'di', 'del', 'della',
    'che', 'con', 'per', 'in', 'su', 'da', 'tra', 'fra', 'ma', 'e', 'o'
  ];

  async detectRhymes(text: string, language: string = 'en'): Promise<RhymeGroup[]> {
    // Phase 1: Preprocessing del testo con regex multilingue
    const words = this.extractWords(text);
    
    if (words.length < 2) return [];

    // Phase 2: Analisi fonetica con stress tail
    const wordsWithStressTails = this.extractStressTails(words);
    
    if (wordsWithStressTails.length < 2) return [];

    // Phase 3: Calcolo similarità fonetica pesata (70% vocali, 30% consonanti)
    const similarityMatrix = this.calculateSimilarityMatrix(wordsWithStressTails);

    // Phase 4: Clustering con Union-Find algorithm
    const clusters = this.unionFindClustering(wordsWithStressTails, similarityMatrix);

    // Phase 5: Assegnazione colori e Phase 6: Rendering
    return this.createRhymeGroups(clusters, wordsWithStressTails);
  }

  // Phase 1: Preprocessing multilingue
  private extractWords(text: string) {
    // Regex estesa per tutte le lingue: inglese, italiano, francese, spagnolo, tedesco
    const wordRegex = /\b[a-zA-ZàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚáéíóúýÁÉÍÓÚÝâêîôûÂÊÎÔÛäëïöüÄËÏÖÜñÑçÇßæÆøØåÅ]+\b/g;
    const words: Array<{
      word: string;
      original: string;
      start: number;
      end: number;
      line: number;
      wordIndex: number;
    }> = [];

    const lines = text.split('\n');
    let globalCharIndex = 0;

    lines.forEach((line, lineIndex) => {
      let match;
      const lineRegex = new RegExp(wordRegex.source, 'g');
      
      while ((match = lineRegex.exec(line)) !== null) {
        const cleanWord = match[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        if (cleanWord.length > 2) { // Solo parole significative
          words.push({
            word: cleanWord,
            original: match[0],
            start: globalCharIndex + match.index,
            end: globalCharIndex + match.index + match[0].length,
            line: lineIndex,
            wordIndex: words.filter(w => w.line === lineIndex).length
          });
        }
      }
      
      globalCharIndex += line.length + 1;
    });

    return words;
  }

  // Phase 2: Analisi fonetica con stress tail
  private extractStressTails(words: Array<any>) {
    return words.map(wordObj => {
      const stressTail = this.extractStressTail(wordObj.word);
      return {
        ...wordObj,
        stressTail
      };
    }).filter(w => w.stressTail && w.stressTail.length >= 2);
  }

  private extractStressTail(word: string): string {
    // Prova prima con text-to-ipa se disponibile
    if (textToIPA && textToIPA.lookup) {
      const ipa = textToIPA.lookup(word);
      if (ipa) {
        return this.extractStressTailFromIPA(ipa);
      }
    }

    // Fallback: estrazione basata su pattern linguistici
    return this.extractStressTailFallback(word);
  }

  private extractStressTailFromIPA(ipa: string): string {
    const cleanIPA = ipa.replace(/[\/\[\]]/g, '');
    const stressIndex = cleanIPA.indexOf('ˈ');
    
    if (stressIndex !== -1) {
      return cleanIPA.substring(stressIndex + 1);
    } else {
      return cleanIPA.replace(/[ˈˌ]/g, '');
    }
  }

  private extractStressTailFallback(word: string): string {
    return this.extractItalianStressTail(word);
  }

  // Italian-specific stress tail extraction
  private extractItalianStressTail(word: string): string {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    
    // Minimum length requirement for reliable rhyme detection
    if (cleanWord.length < 3) return '';
    
    // Italian stress rules - oxytone words (stress on last syllable)
    if (cleanWord.endsWith('à') || cleanWord.endsWith('ì') || 
        cleanWord.endsWith('ò') || cleanWord.endsWith('ù') ||
        cleanWord.endsWith('é')) {
      return cleanWord.slice(-3); // Include trisyllabic ending
    }
    
    // Common Italian rhyme patterns - check for specific endings
    const commonPatterns = [
      'ale', 'are', 'ere', 'ire', 'ore', 'ato', 'eto', 'ito', 'oto', 'uto',
      'ane', 'ene', 'ine', 'one', 'une', 'ante', 'ente', 'zione', 'sione'
    ];
    
    for (const pattern of commonPatterns) {
      if (cleanWord.endsWith(pattern)) {
        return pattern;
      }
    }
    
    // Default: extract from penultimate vowel (typical Italian stress)
    const vowels = 'aeiou';
    const vowelPositions = [];
    
    for (let i = 0; i < cleanWord.length; i++) {
      if (vowels.includes(cleanWord[i])) {
        vowelPositions.push(i);
      }
    }
    
    if (vowelPositions.length >= 2) {
      // Extract from penultimate vowel for paroxytone words
      const penultimateVowel = vowelPositions[vowelPositions.length - 2];
      return cleanWord.slice(penultimateVowel);
    } else if (vowelPositions.length === 1) {
      return cleanWord.slice(vowelPositions[0]);
    }
    
    // Fallback - last 3 characters but ensure minimum length
    const tail = cleanWord.slice(-3);
    return tail.length >= 3 ? tail : '';
  }

  // Phase 3: Calcolo similarità fonetica pesata
  private calculateSimilarityMatrix(words: Array<any>): number[][] {
    const matrix: number[][] = [];
    
    for (let i = 0; i < words.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < words.length; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          matrix[i][j] = this.calculatePhoneticSimilarity(words[i].stressTail, words[j].stressTail);
        }
      }
    }
    
    return matrix;
  }

  private calculatePhoneticSimilarity(tail1: string, tail2: string): number {
    if (tail1 === tail2) return 1.0;
    if (!tail1 || !tail2) return 0.0;

    // Calculate base phonetic score using Italian-optimized weights
    const vowels = 'aeiouáéíóúàèìòùâêîôûäëïöüæøå';
    const vowels1 = tail1.split('').filter(c => vowels.includes(c.toLowerCase()));
    const vowels2 = tail2.split('').filter(c => vowels.includes(c.toLowerCase()));
    const consonants1 = tail1.split('').filter(c => !vowels.includes(c.toLowerCase()));
    const consonants2 = tail2.split('').filter(c => !vowels.includes(c.toLowerCase()));

    const vowelSimilarity = this.phoneticSequenceSimilarity(vowels1, vowels2, true);
    const consonantSimilarity = this.phoneticSequenceSimilarity(consonants1, consonants2, false);

    // Italian-optimized weights: 80% vowels, 20% consonants
    let baseScore = (vowelSimilarity * 0.8) + (consonantSimilarity * 0.2);

    // Apply Italian-specific filters
    baseScore = this.filterIrrelevantSuffixes(tail1, tail2, baseScore);
    
    return baseScore;
  }

  // Filter irrelevant Italian suffixes
  private filterIrrelevantSuffixes(tail1: string, tail2: string, similarity: number): number {
    for (const suffix of this.irrelevantSuffixes) {
      if (tail1.endsWith(suffix) && tail2.endsWith(suffix)) {
        return similarity * 0.3; // Drastically penalize common suffixes
      }
    }
    return similarity;
  }

  private phoneticSequenceSimilarity(seq1: string[], seq2: string[], isVowels: boolean): number {
    if (seq1.length === 0 && seq2.length === 0) return 1.0;
    if (seq1.length === 0 || seq2.length === 0) return 0.0;

    let totalSimilarity = 0;
    const maxLength = Math.max(seq1.length, seq2.length);
    
    // Confronta dalla fine (più importante per le rime)
    for (let i = 0; i < maxLength; i++) {
      const char1 = seq1[seq1.length - 1 - i] || '';
      const char2 = seq2[seq2.length - 1 - i] || '';
      
      if (char1 && char2) {
        totalSimilarity += this.getPhoneticSimilarity(char1, char2, isVowels);
      }
    }
    
    return totalSimilarity / maxLength;
  }

  private getPhoneticSimilarity(char1: string, char2: string, isVowels: boolean): number {
    if (char1 === char2) return 1.0;
    
    if (isVowels) {
      // Mappatura vocali simili fonicamente
      const vowelGroups = [
        ['a', 'à', 'á', 'â', 'ä'],
        ['e', 'è', 'é', 'ê', 'ë'],
        ['i', 'ì', 'í', 'î', 'ï'],
        ['o', 'ò', 'ó', 'ô', 'ö'],
        ['u', 'ù', 'ú', 'û', 'ü']
      ];
      
      for (const group of vowelGroups) {
        if (group.includes(char1.toLowerCase()) && group.includes(char2.toLowerCase())) {
          return 0.9; // Vocali simili
        }
      }
    } else {
      // Mappatura consonanti simili fonicamente
      const consonantGroups = [
        ['b', 'p'], ['d', 't'], ['g', 'k'], ['v', 'f'],
        ['z', 's'], ['m', 'n'], ['l', 'r']
      ];
      
      for (const group of consonantGroups) {
        if (group.includes(char1.toLowerCase()) && group.includes(char2.toLowerCase())) {
          return 0.7; // Consonanti simili
        }
      }
    }
    
    return 0.0; // Nessuna similarità
  }

  private sequenceSimilarity(seq1: string[], seq2: string[]): number {
    if (seq1.length === 0 && seq2.length === 0) return 1.0;
    if (seq1.length === 0 || seq2.length === 0) return 0.0;

    let matches = 0;
    const minLength = Math.min(seq1.length, seq2.length);
    
    // Confronto dalla fine (più importante per le rime)
    for (let i = 1; i <= minLength; i++) {
      if (seq1[seq1.length - i] === seq2[seq2.length - i]) {
        matches++;
      } else {
        break;
      }
    }
    
    const maxLength = Math.max(seq1.length, seq2.length);
    return matches / maxLength;
  }

  // Phase 4: Union-Find clustering with Italian-specific validation
  private unionFindClustering(words: Array<any>, similarityMatrix: number[][]): number[][] {
    const n = words.length;
    const { find, union } = this.createUnionFind(n);

    // Use dynamic threshold calculation instead of fixed 0.7
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const word1 = words[i].word;
        const word2 = words[j].word;
        const similarity = similarityMatrix[i][j];
        
        // Calculate optimal threshold for this word pair
        const threshold = this.calculateOptimalThreshold(words[i].stressTail, words[j].stressTail);
        
        // Validate rhyme context (exclude function words, etc.)
        const isValidRhyme = this.validateRhymeContext(word1, word2, similarity);
        
        if (isValidRhyme && similarity >= threshold) {
          union(i, j);
        }
      }
    }

    // Raggruppamento per componenti connessi
    const clusters: Map<number, number[]> = new Map();
    
    for (let i = 0; i < n; i++) {
      const root = find(i);
      if (!clusters.has(root)) {
        clusters.set(root, []);
      }
      clusters.get(root)!.push(i);
    }

    // Filtra cluster con almeno 2 elementi
    return Array.from(clusters.values()).filter(cluster => cluster.length >= 2);
  }

  // Calculate dynamic threshold based on word characteristics
  private calculateOptimalThreshold(tail1: string, tail2: string): number {
    const baseThreshold = 0.85; // Much higher base threshold
    
    // Perfect rhymes for common Italian patterns
    const commonPatterns = [
      'ale', 'are', 'ere', 'ire', 'ore', 'ato', 'eto', 'ito', 'oto', 'uto',
      'ane', 'ene', 'ine', 'one', 'une', 'ante', 'ente', 'zione', 'sione'
    ];
    
    for (const pattern of commonPatterns) {
      if (tail1.endsWith(pattern) && tail2.endsWith(pattern)) {
        return Math.min(baseThreshold + 0.1, 0.95); // Even higher for perfect patterns
      }
    }
    
    return baseThreshold;
  }

  // Validate rhyme context to eliminate false positives
  private validateRhymeContext(word1: string, word2: string, phoneticScore: number): boolean {
    // Exclude words that are too similar (potential false positives)
    if (this.levenshteinDistance(word1, word2) <= 1 && word1.length > 3) {
      return false; // Too similar, likely variants of same word
    }
    
    // Exclude Italian function words
    if (this.functionWords.includes(word1) || this.functionWords.includes(word2)) {
      return false;
    }
    
    // Require minimum phonetic score
    return phoneticScore >= 0.75;
  }

  // Simple Levenshtein distance calculation
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private createUnionFind(n: number) {
    const parent = Array.from({ length: n }, (_, i) => i);

    const find = (x: number): number => {
      if (parent[x] !== x) {
        parent[x] = find(parent[x]); // Path compression
      }
      return parent[x];
    };

    const union = (x: number, y: number): void => {
      const px = find(x);
      const py = find(y);
      if (px !== py) {
        parent[px] = py;
      }
    };

    return { find, union };
  }

  // Phase 5 & 6: Assegnazione colori e creazione gruppi finali
  private createRhymeGroups(clusters: number[][], words: Array<any>): RhymeGroup[] {
    return clusters.map((cluster, index) => {
      const clusterWords = cluster.map(i => words[i]);
      
      // Calcola forza media del gruppo
      let totalSimilarity = 0;
      let comparisons = 0;
      
      for (let i = 0; i < cluster.length; i++) {
        for (let j = i + 1; j < cluster.length; j++) {
          totalSimilarity += this.calculatePhoneticSimilarity(
            words[cluster[i]].stressTail, 
            words[cluster[j]].stressTail
          );
          comparisons++;
        }
      }
      
      const avgStrength = comparisons > 0 ? totalSimilarity / comparisons : 0;
      const type = avgStrength >= 0.8 ? 'perfect' : avgStrength >= 0.6 ? 'near' : 'slant';

      return {
        id: `rhyme-${index}`,
        words: clusterWords.map(w => w.word),
        color: this.rhymeColors[index % this.rhymeColors.length],
        type: type as RhymeGroup['type'],
        strength: avgStrength,
        positions: clusterWords.map(w => ({
          line: w.line,
          wordIndex: w.wordIndex,
          word: w.word,
          startChar: w.start,
          endChar: w.end
        }))
      };
    });
  }
}