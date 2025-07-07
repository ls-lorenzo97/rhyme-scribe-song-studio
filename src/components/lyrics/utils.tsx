import { RhymeGroup } from './AILyricsAssistant';

export function analyzeRhymeScheme(rhymeGroups: RhymeGroup[], lines: string[]): string[] {
  const scheme: string[] = [];
  const usedLetters: { [key: string]: string } = {};
  let currentLetter = 'A';

  lines.forEach((line, lineIndex) => {
    if (!line.trim()) {
      scheme.push('-');
      return;
    }

    const words = line.trim().split(/\s+/);
    const lastWord = words[words.length - 1]?.toLowerCase().replace(/[^a-z]/g, '');
    
    if (!lastWord) {
      scheme.push('-');
      return;
    }

    const rhymeGroup = rhymeGroups.find(group =>
      group.positions.some(pos => pos.line === lineIndex && pos.word === lastWord)
    );

    if (rhymeGroup) {
      const groupKey = rhymeGroup.words.sort().join(',');
      if (usedLetters[groupKey]) {
        scheme.push(usedLetters[groupKey]);
      } else {
        usedLetters[groupKey] = currentLetter;
        scheme.push(currentLetter);
        currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
      }
    } else {
      scheme.push(currentLetter);
      currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
    }
  });

  return scheme;
}