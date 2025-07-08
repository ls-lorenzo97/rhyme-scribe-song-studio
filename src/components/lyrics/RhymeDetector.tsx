import { RhymeGroup } from './AILyricsAssistant';

// Import IPA library
let textToIPA: any = null;

try {
  textToIPA = require('text-to-ipa');
} catch (e) {
  console.warn('text-to-ipa library not available');
}

// Phase 1: Phonetic Preprocessing Functions
function getIPATranscription(word: string): string {
  if (!textToIPA || !textToIPA.lookup) {
    return '';
  }
  
  const ipaResult = textToIPA.lookup(word.toLowerCase());
  console.log(`🔍 IPA for "${word}": "${ipaResult}"`);
  
  return ipaResult || '';
}

function extractStressTail(ipaWord: string): string {
  if (!ipaWord || ipaWord.length === 0) return '';
  
  // Clean IPA delimiters
  let cleanIPA = ipaWord.replace(/[\/\[\]]/g, '');
  
  // Find primary stress marker (ˈ)
  const stressIndex = cleanIPA.indexOf('ˈ');
  
  if (stressIndex !== -1) {
    // Extract from stress marker to end
    const stressTail = cleanIPA.substring(stressIndex + 1);
    console.log(`🎵 Stress tail for "${ipaWord}": "${stressTail}"`);
    return stressTail;
  } else {
    // For monosyllables: use entire word (remove stress markers)
    const monosyllable = cleanIPA.replace(/[ˈˌ]/g, '');
    console.log(`🎵 Monosyllable tail for "${ipaWord}": "${monosyllable}"`);
    return monosyllable;
  }
}

// Phase 2: Phonetic Comparison Functions
function extractPhoneticEnding(ipaWord: string, length: number = 2): string {
  return ipaWord.slice(-length);
}

function comparePhoneticEndings(tail1: string, tail2: string): { similarity: number; matchLength: number } {
  if (!tail1 || !tail2) return { similarity: 0, matchLength: 0 };
  
  let matches = 0;
  const minLength = Math.min(tail1.length, tail2.length);
  
  // Compare from end backwards
  for (let i = 1; i <= minLength; i++) {
    const char1 = tail1[tail1.length - i];
    const char2 = tail2[tail2.length - i];
    
    if (char1 === char2) {
      matches++;
    } else {
      break; // Stop at first non-match
    }
  }
  
  const maxLength = Math.max(tail1.length, tail2.length);
  const similarity = maxLength > 0 ? matches / maxLength : 0;
  
  return { similarity, matchLength: matches };
}

function analyzeRhymeStrength(similarity: number, matchLength: number): { 
  type: RhymeGroup['type']; 
  strength: number; 
} {
  if (similarity >= 0.8 && matchLength >= 2) {
    return { type: 'perfect', strength: similarity };
  } else if (similarity >= 0.6 && matchLength >= 1) {
    return { type: 'near', strength: similarity };
  } else if (similarity >= 0.3) {
    return { type: 'slant', strength: similarity };
  }
  
  return { type: 'near', strength: similarity };
}

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
      stressTail: string;
    }> = [];
    
    let globalCharIndex = 0;
    
    // Process all lines and extract stress tails
    lines.forEach((line, lineIndex) => {
      const lineWords = line.trim().split(/\s+/);
      
      lineWords.forEach((word, wordIndex) => {
        const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
        if (cleanWord.length > 2) {
          // Phase 1: Get IPA transcription and extract stress tail
          const ipaTranscription = getIPATranscription(cleanWord);
          
          if (ipaTranscription) {
            const stressTail = extractStressTail(ipaTranscription);
            
            if (stressTail && stressTail.length >= 2) {
              const startChar = globalCharIndex + wordIndex * (word.length + 1);
              const endChar = startChar + word.length;
              
              words.push({ 
                word: cleanWord, 
                line: lineIndex, 
                wordIndex, 
                startChar,
                endChar,
                stressTail
              });
              
              console.log(`✅ Added word "${cleanWord}" with stress tail "${stressTail}"`);
            }
          }
        }
      });

      globalCharIndex += line.length + 1;
    });

    console.log('🎵 Words with stress tails:', words.map(w => ({ word: w.word, stressTail: w.stressTail })));

    // Phase 2: Group words by phonetic similarity
    const rhymeGroups: RhymeGroup[] = [];
    const processedWords = new Set<string>();
    let colorIndex = 0;

    for (let i = 0; i < words.length; i++) {
      if (processedWords.has(words[i].word)) continue;
      
      const currentWord = words[i];
      const rhymeGroup = [currentWord];
      processedWords.add(currentWord.word);
      
      // Find all words that rhyme with current word
      for (let j = i + 1; j < words.length; j++) {
        if (processedWords.has(words[j].word)) continue;
        
        const comparison = comparePhoneticEndings(currentWord.stressTail, words[j].stressTail);
        
        if (comparison.similarity >= 0.6) {  // Minimum threshold
          rhymeGroup.push(words[j]);
          processedWords.add(words[j].word);
        }
      }
      
      // Only create groups with 2+ words
      if (rhymeGroup.length >= 2) {
        const { type, strength } = analyzeRhymeStrength(
          Math.max(...rhymeGroup.slice(1).map(w => 
            comparePhoneticEndings(currentWord.stressTail, w.stressTail).similarity
          )),
          Math.max(...rhymeGroup.slice(1).map(w => 
            comparePhoneticEndings(currentWord.stressTail, w.stressTail).matchLength
          ))
        );
        
        rhymeGroups.push({
          id: `rhyme-${colorIndex}`,
          words: rhymeGroup.map(w => w.word),
          color: this.rhymeColors[colorIndex % this.rhymeColors.length],
          type,
          strength,
          positions: rhymeGroup.map(w => ({
            line: w.line,
            wordIndex: w.wordIndex,
            word: w.word,
            startChar: w.startChar,
            endChar: w.endChar
          }))
        });
        
        colorIndex++;
        console.log(`🎵 Created rhyme group: ${rhymeGroup.map(w => w.word).join(', ')} (${type}, ${Math.round(strength * 100)}%)`);
      }
    }

    return rhymeGroups;
  }
}