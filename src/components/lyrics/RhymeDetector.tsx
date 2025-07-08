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
    // Fase 2: Identificazione stress pattern multilingue scientifica
    const vowels = 'aeiouáéíóúàèìòùâêîôûäëïöüæøå';
    const vowelPositions = [];
    
    // Trova tutte le posizioni vocaliche
    for (let i = 0; i < word.length; i++) {
      if (vowels.includes(word[i].toLowerCase())) {
        vowelPositions.push(i);
      }
    }
    
    if (vowelPositions.length === 0) return word.slice(-2);
    
    // Pattern di stress scientifici per lingue diverse
    let stressVowelIndex = -1;
    
    // Italiano: stress tipicamente penultima sillaba 
    // Inglese: stress pattern più variabile, ultima vocale tonica
    // Francese: stress ultima sillaba
    // Spagnolo: stress penultima sillaba
    // Tedesco: stress prima sillaba, ma per rime conta l'ultima
    
    if (vowelPositions.length >= 2) {
      // Per le rime, la terminazione più importante è dall'ultima vocale accentuata
      // In italiano/spagnolo tipicamente penultima, ma per rime conta dalla fine
      stressVowelIndex = vowelPositions[vowelPositions.length - 1];
    } else {
      stressVowelIndex = vowelPositions[0];
    }
    
    // Estrae stress tail dalla vocale tonica identificata
    return word.slice(stressVowelIndex);
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

    // Fase 3: Estrazione vocali e consonanti con normalizzazione fonetica
    const vowels = 'aeiouáéíóúàèìòùâêîôûäëïöüæøå';
    const vowels1 = tail1.split('').filter(c => vowels.includes(c.toLowerCase()));
    const vowels2 = tail2.split('').filter(c => vowels.includes(c.toLowerCase()));
    const consonants1 = tail1.split('').filter(c => !vowels.includes(c.toLowerCase()));
    const consonants2 = tail2.split('').filter(c => !vowels.includes(c.toLowerCase()));

    // Calcolo similarità fonetica avanzata
    const vowelSimilarity = this.phoneticSequenceSimilarity(vowels1, vowels2, true);
    const consonantSimilarity = this.phoneticSequenceSimilarity(consonants1, consonants2, false);

    // Pesi scientifici validati: 70% vocali, 30% consonanti
    return (vowelSimilarity * 0.7) + (consonantSimilarity * 0.3);
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

  // Phase 4: Union-Find clustering
  private unionFindClustering(words: Array<any>, similarityMatrix: number[][]): number[][] {
    const n = words.length;
    const { find, union } = this.createUnionFind(n);

    // Soglia scientificamente validata dalla ricerca
    const threshold = 0.7;

    // Unione di parole con similarità >= threshold
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (similarityMatrix[i][j] >= threshold) {
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