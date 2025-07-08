import { phonemize } from 'phonemize';
import pronouncing from 'pronouncingjs';

export class RhymeDetector {
  // Palette di colori per i gruppi di rime
  rhymeColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA',
    '#FFD1B3', '#E1BAFF', '#FFB3F0', '#B3FFDA', '#D1FFB3'
  ];

  functionWords = {
    it: ['il','la','lo','gli','le','un','una','di','del','della','che','con','per','in','su','da','tra','fra','ma','e','o'],
    en: ['the','a','an','of','with','in','on','at','by','for','to','and','or','but','if','then','so'],
    es: ['el','la','los','las','un','una','unos','unas','de','del','que','con','por','en','su','y','o'],
    fr: ['le','la','les','un','une','des','de','du','que','avec','pour','dans','sur','et','ou'],
    de: ['der','die','das','ein','eine','einer','eines','mit','von','zu','und','oder','aber','im','am']
  };

  irrelevantSuffixes = [
    'mente','zione','sione','amento','imento','abile','ibile','evole','ando','endo','ante','ente'
  ];

  // Regex per parole multilingue
  wordRegex = /\b[a-zA-ZàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚáéíóúýÁÉÍÓÚÝâêîôûÂÊÎÔÛäëïöüÄËÏÖÜñÑçÇßæÆøØåÅ]{3,}\b/g;

  async detectRhymes(text, language = 'it') {
    const words = this.extractWords(text, language);
    if (words.length < 2) return [];
    const wordsWithTails = await this.extractStressTails(words, language);
    if (wordsWithTails.length < 2) return [];
    const similarityMatrix = this.calculateSimilarityMatrix(wordsWithTails, language);
    const clusters = this.unionFindClustering(wordsWithTails, similarityMatrix, language);
    return this.createRhymeGroups(clusters, wordsWithTails);
  }

  extractWords(text, language) {
    const lines = text.split('\n');
    let globalCharIndex = 0;
    const words = [];
    lines.forEach((line, lineIndex) => {
      let match;
      const lineRegex = new RegExp(this.wordRegex.source, 'g');
      while ((match = lineRegex.exec(line)) !== null) {
        const cleanWord = match[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        words.push({
          word: cleanWord,
          original: match[0],
          start: globalCharIndex + match.index,
          end: globalCharIndex + match.index + match[0].length,
          line: lineIndex,
          wordIndex: words.filter(w => w.line === lineIndex).length
        });
      }
      globalCharIndex += line.length + 1;
    });
    return words;
  }

  async extractStressTails(words, language) {
    return await Promise.all(words.map(async wordObj => {
      let stressTail = '';
      if (language === 'en') {
        // Usa pronouncingjs per l’inglese
        const phones = pronouncing.phonesForWord(wordObj.word)[0];
        if (phones) {
          const parts = phones.split(' ');
          const lastStress = parts.lastIndexOf(p => /\d/.test(p));
          stressTail = parts.slice(lastStress >= 0 ? lastStress : -3).join(' ');
        }
      } else {
        // Usa phonemize per le altre lingue
        const ipaArr = await phonemize(wordObj.word, { language });
        if (ipaArr && ipaArr[0]) {
          const ipa = ipaArr[0].replace(/[ˌ]/g, '');
          const idx = ipa.indexOf('ˈ');
          stressTail = idx >= 0 ? ipa.slice(idx + 1) : ipa.slice(-3);
        }
      }
      // Fallback: ultimi 3 caratteri
      if (!stressTail) stressTail = wordObj.word.slice(-3);
      return { ...wordObj, stressTail };
    }));
  }

  calculateSimilarityMatrix(words, language) {
    const matrix = [];
    for (let i = 0; i < words.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < words.length; j++) {
        if (i === j) matrix[i][j] = 1.0;
        else matrix[i][j] = this.calculatePhoneticSimilarity(words[i].stressTail, words[j].stressTail, language);
      }
    }
    return matrix;
  }

  calculatePhoneticSimilarity(tail1, tail2, language) {
    if (tail1 === tail2) return 1.0;
    if (!tail1 || !tail2) return 0.0;
    const vowels = 'aeiouáéíóúàèìòùâêîôûäëïöüæøå';
    const vowels1 = tail1.split('').filter(c => vowels.includes(c.toLowerCase()));
    const vowels2 = tail2.split('').filter(c => vowels.includes(c.toLowerCase()));
    const consonants1 = tail1.split('').filter(c => !vowels.includes(c.toLowerCase()));
    const consonants2 = tail2.split('').filter(c => !vowels.includes(c.toLowerCase()));
    const vowelSimilarity = this.sequenceSimilarity(vowels1, vowels2);
    const consonantSimilarity = this.sequenceSimilarity(consonants1, consonants2);
    // Pesi: 80% vocali per lingue romanze, 70% per tedesco/inglese
    const vowelWeight = ['it','es','fr'].includes(language) ? 0.8 : 0.7;
    const baseScore = (vowelSimilarity * vowelWeight) + (consonantSimilarity * (1-vowelWeight));
    // Penalizza suffissi comuni
    for (const suffix of this.irrelevantSuffixes) {
      if (tail1.endsWith(suffix) && tail2.endsWith(suffix)) return baseScore * 0.3;
    }
    return baseScore;
  }

  sequenceSimilarity(seq1, seq2) {
    if (seq1.length === 0 && seq2.length === 0) return 1.0;
    if (seq1.length === 0 || seq2.length === 0) return 0.0;
    let matches = 0;
    const minLength = Math.min(seq1.length, seq2.length);
    for (let i = 1; i <= minLength; i++) {
      if (seq1[seq1.length - i] === seq2[seq2.length - i]) matches++;
      else break;
    }
    const maxLength = Math.max(seq1.length, seq2.length);
    return matches / maxLength;
  }

  unionFindClustering(words, similarityMatrix, language) {
    const n = words.length;
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = x => (parent[x] !== x ? (parent[x] = find(parent[x])) : x);
    const union = (x, y) => { const px = find(x), py = find(y); if (px !== py) parent[px] = py; };
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const sim = similarityMatrix[i][j];
        const threshold = ['it','es','fr'].includes(language) ? 0.85 : 0.8;
        if (this.validateRhymeContext(words[i].word, words[j].word, sim, language) && sim >= threshold) {
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
    if (this.levenshteinDistance(word1, word2) <= 1 && word1.length > 3) return false;
    if (this.functionWords[language]?.includes(word1) || this.functionWords[language]?.includes(word2)) return false;
    return phoneticScore >= 0.75;
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
    });
  }
}
