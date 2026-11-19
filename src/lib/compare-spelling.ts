/** Align the written letters. A highlighted letter is a transcript difference. */
export function compareSpelling(target: string, heard: string) {
  return compareSymbols(Array.from(target), Array.from(heard));
}

export function compareSymbols(target: readonly string[], heard: readonly string[]) {
  const expected = Array.from(target, (letter) => ({ letter, different: true }));
  const recognized = Array.from(heard, (letter) => ({ letter, different: true }));
  const distances = Array.from({ length: expected.length + 1 }, (_, i) => {
    const row = Array<number>(recognized.length + 1).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 1; j <= recognized.length; j++) distances[0]![j] = j;
  for (let i = 1; i <= expected.length; i++) {
    for (let j = 1; j <= recognized.length; j++) {
      const cost = expected[i - 1]!.letter === recognized[j - 1]!.letter ? 0 : 1;
      distances[i]![j] = Math.min(
        distances[i - 1]![j - 1]! + cost,
        distances[i - 1]![j]! + 1,
        distances[i]![j - 1]! + 1,
      );
    }
  }

  let i = expected.length;
  let j = recognized.length;
  while (i > 0 && j > 0) {
    const targetLetter = expected[i - 1]!;
    const heardLetter = recognized[j - 1]!;
    const equal = targetLetter.letter === heardLetter.letter;
    if (distances[i]![j] === distances[i - 1]![j - 1]! + (equal ? 0 : 1)) {
      targetLetter.different = heardLetter.different = !equal;
      i--;
      j--;
    } else if (distances[i]![j] === distances[i - 1]![j]! + 1) {
      i--;
    } else {
      j--;
    }
  }
  return { expected, recognized, distance: distances[expected.length]![recognized.length]! };
}
