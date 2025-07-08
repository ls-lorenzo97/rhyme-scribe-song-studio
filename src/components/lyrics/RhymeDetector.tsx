export class RhymeDetector {
  constructor() {
    this.rhymeColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA'
    ];

    // Stopwords estese per filtraggio
    this.functionWords = {
      it: ['il','la','lo','gli','le','un','una','di','del','della','che','con','per','in','su','da','tra','fra','ma','e','o'],
      en: ['the','a','an','of','with','in','on','at','by','for','to','and','or','but','if','then','so'],
      es: ['el','la','los','las','un','una','de','del','que','con','por','en','su','y','o'],
      fr: ['le','la','les','un','une','des','de','du','que','avec','pour','dans','sur','et','ou'],
      de: ['der','die','das','ein','eine','mit','von','zu','und','oder','aber','im','am']
    };

    // Suffissi che creano false rime
    this.commonSuffixes = ['mente', 'zione', 'sione', 'amento', 'ing', 'ed', 'ly'];
    
    this.epitranEndpoint = 'http://localhost:5000';
    this.ipaCache = new Map();
  }

  async detectRhymes(text, language = 'it') {
    const words = this.extractWords(text, language);
    if (words.length < 2) return [];

    const wordsWithStressTails = await this.extractStressTails(words, language);
    const similarityMatrix = this.calculateSimilarityMatrix(wordsWithStressTails, language);
    const clusters = this.unionFindClustering(wordsWithStressTails, similarityMatrix, language);
    
    return this.createRhymeGroups(clusters, wordsWithStressTails);
  }

  extractWords(text, language) {
    const wordRegex = /\b[a-zA-ZàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚáéíóúýÁÉÍÓÚÝâêîôûÂÊÎÔÛäëïöüÄËÏÖÜñÑçÇßæÆøØåÅ]{3,}\b/g;
    const lines = text.split('\n');
    let globalCharIndex = 0;
    const words = [];

    lines.forEach((line, lineIndex) => {
      let match;
      const lineRegex = new RegExp(wordRegex.source, 'g');
      
      while ((match = lineRegex.exec(line)) !== null) {
        const cleanWord = match[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Salta parole funzione e parole troppo corte
        if (!this.functionWords[language]?.includes(cleanWord) && cleanWord.length >= 3) {
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

  async extractStressTails(words, language) {
    const results = [];
    
    for (const wordObj of words) {
      const cacheKey = `${wordObj.word}-${language}`;
      
      let stressTail;
      if (this.ipaCache.has(cacheKey)) {
        stressTail = this.ipaCache.get(cacheKey);
      } else {
        stressTail = await this.getStressTailFromAPI(wordObj.word, language);
        this.ipaCache.set(cacheKey, stressTail);
      }
      
      results.push({
        ...wordObj,
        stressTail: stressTail || wordObj.word.slice(-3)
      });
    }
    
    return results;
  }

  async getStressTailFromAPI(word, language) {
    try {
      const response = await fetch(`${this.epitranEndpoint}/stress-tail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, language })
      });

      if (!response.ok) return null;
      
      const data = await response.json();
      return data.stress_tail;
    } catch (error) {
      console.warn(`API call failed for "${word}":`, error.message);
      return null;
    }
  }

  calculateSimilarityMatrix(words, language) {
    const matrix = [];
    for (let i = 0; i < words.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < words.length; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          matrix[i][j] = this.calculatePhoneticSimilarity(
            words[i].stressTail, words[j].stressTail, language
          );
        }
      }
    }
    return matrix;
  }

  calculatePhoneticSimilarity(tail1, tail2, language) {
    if (tail1 === tail2) return 1.0;
    if (!tail1 || !tail2 || tail1.length < 2 || tail2.length < 2) return 0.0;

    const vowels = 'aeiouáéíóúàèìòùâêîôûäëïöüæøåɑɔɛɪʊəɨ';
    const vowels1 = tail1.split('').filter(c => vowels.includes(c.toLowerCase()));
    const vowels2 = tail2.split('').filter(c => vowels.includes(c.toLowerCase()));
    const consonants1 = tail1.split('').filter(c => !vowels.includes(c.toLowerCase()) && /[a-zA-Z]/.test(c));
    const consonants2 = tail2.split('').filter(c => !vowels.includes(c.toLowerCase()) && /[a-zA-Z]/.test(c));

    const vowelSimilarity = this.sequenceSimilarity(vowels1, vowels2);
    const consonantSimilarity = this.sequenceSimilarity(consonants1, consonants2);

    // Pesi specifici per lingua
    const vowelWeight = ['it', 'es', 'fr'].includes(language) ? 0.85 : 0.75;
    const baseScore = (vowelSimilarity * vowelWeight) + (consonantSimilarity * (1 - vowelWeight));

    // Penalizza suffissi comuni
    for (const suffix of this.commonSuffixes) {
      if (tail1.endsWith(suffix) && tail2.endsWith(suffix) && tail1 !== tail2) {
        return baseScore * 0.3;
      }
    }

    return baseScore;
  }

  sequenceSimilarity(seq1, seq2) {
    if (seq1.length === 0 && seq2.length === 0) return 1.0;
    if (seq1.length === 0 || seq2.length === 0) return 0.0;

    let matches = 0;
    const minLength = Math.min(seq1.length, seq2.length);
    
    // Confronta dalla fine (similarità di suffisso)
    for (let i = 1; i <= minLength; i++) {
      if (seq1[seq1.length - i] === seq2[seq2.length - i]) {
        matches++;
      } else {
        break;
      }
    }

    return matches / Math.max(seq1.length, seq2.length);
  }

  unionFindClustering(words, similarityMatrix, language) {
    const n = words.length;
    const parent = Array.from({ length: n }, (_, i) => i);
    
    const find = (x) => (parent[x] !== x ? (parent[x] = find(parent[x])) : x);
    const union = (x, y) => {
      const px = find(x), py = find(y);
      if (px !== py) parent[px] = py;
    };

    // **SOGLIE PIÙ RIGIDE** per ridurre falsi positivi
    const perfectThreshold = ['it', 'es', 'fr'].includes(language) ? 0.95 : 0.90;
    const nearThreshold = ['it', 'es', 'fr'].includes(language) ? 0.85 : 0.80;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const sim = similarityMatrix[i][j];
        
        if (sim >= perfectThreshold && this.validateRhymeContext(words[i], words[j], sim, language)) {
          union(i, j);
        } else if (sim >= nearThreshold && this.validateStrictRhymeContext(words[i], words[j], sim, language)) {
          union(i, j);
        }
      }
    }

    const clusters = new Map();
    for (let i = 0; i < n; i++) {
      const root = find(i);
      if (!clusters.has(root)) clusters.set(root, []);
      clusters.get(root).push(i);
    }

    return Array.from(clusters.values()).filter(cluster => cluster.length >= 2);
  }

  validateRhymeContext(word1, word2, phoneticScore, language) {
    // Rifiuta se le parole sono troppo simili (varianti morfologiche)
    if (this.levenshteinDistance(word1.word, word2.word) <= 1 && word1.word.length > 3) {
      return false;
    }
    return phoneticScore >= 0.75;
  }

  validateStrictRhymeContext(word1, word2, phoneticScore, language) {
    if (!this.validateRhymeContext(word1, word2, phoneticScore, language)) {
      return false;
    }

    // Lunghezza minima stress tail
    if (word1.stressTail.length < 2 || word2.stressTail.length < 2) {
      return false;
    }

    // Rifiuta se le parole sono sulla stessa riga troppo vicine
    if (word1.line === word2.line && Math.abs(word1.wordIndex - word2.wordIndex) <= 2) {
      return false;
    }

    return true;
  }

  levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] = b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    
    return matrix[b.length][a.length];
  }

  createRhymeGroups(clusters, words) {
    return clusters.map((cluster, index) => {
      const clusterWords = cluster.map(i => words[i]);
      
      let totalSimilarity = 0, comparisons = 0;
      for (let i = 0; i < cluster.length; i++) {
        for (let j = i + 1; j < cluster.length; j++) {
          totalSimilarity += this.calculatePhoneticSimilarity(
            words[cluster[i]].stressTail, words[cluster[j]].stressTail
          );
          comparisons++;
        }
      }
      
      const avgStrength = comparisons > 0 ? totalSimilarity / comparisons : 0;
      const type = avgStrength >= 0.90 ? 'perfect' : avgStrength >= 0.75 ? 'near' : 'weak';
      
      // **RESTITUISCI SOLO GRUPPI FORTI**
      if (avgStrength < 0.75) return null;
      
      return {
        id: `rhyme-${index}`,
        words: clusterWords.map(w => w.word),
        color: this.rhymeColors[index % this.rhymeColors.length],
        type,
        strength: avgStrength,
        positions: clusterWords.map(w => ({
          line: w.line,
          wordIndex: w.wordIndex,
          word: w.word,
          startChar: w.start,
          endChar: w.end
        }))
      };
    }).filter(group => group !== null);
  }
}
