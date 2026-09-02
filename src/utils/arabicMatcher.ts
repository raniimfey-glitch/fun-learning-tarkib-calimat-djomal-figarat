/**
 * Arabic Phonetic & Text Normalization and Matching Utility
 * Specifically optimized for children's speech recognition and education.
 */

/**
 * Remove tashkeel (harakat), tatweel, normalize alefs, taa marbuta, and clean punctuation.
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // Remove tashkeel (fatha, damma, kasra, tanween, sukun, shadda) and tatweel (ـ)
    .replace(/[ـ\-]/g, '') // Remove dashes/tatweel in syllables
    .replace(/[أإآٱ]/g, 'ا') // Normalize Alef
    .replace(/ة/g, 'ه') // Normalize Taa Marbuta
    .replace(/[ى]/g, 'ي') // Normalize Alef Maqsura
    .replace(/[.,،؛:!؟\-_()\[\]{}"'«»\n\r]/g, ' ') // Punctuation to spaces
    .replace(/\s+/g, ' ') // Collapse multiple whitespace
    .trim()
    .toLowerCase();
}

/**
 * Tokenize normalized Arabic text into distinct words
 */
export function getArabicTokens(text: string): string[] {
  return normalizeArabicText(text).split(' ').filter(Boolean);
}

/**
 * Fast Levenshtein-based similarity between two strings (0.0 to 1.0)
 */
export function calculateArabicSimilarity(s1: string, s2: string): number {
  const norm1 = normalizeArabicText(s1);
  const norm2 = normalizeArabicText(s2);

  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 1;

  const len1 = norm1.length;
  const len2 = norm2.length;
  const longer = len1 > len2 ? norm1 : norm2;
  const shorter = len1 > len2 ? norm2 : norm1;

  // Containment check
  if (longer.includes(shorter) && shorter.length >= 3) {
    return shorter.length / longer.length;
  }

  // Count common character n-grams
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) {
      matches++;
    }
  }

  return matches / longer.length;
}

/**
 * LEVEL 1: Check if spoken text matches the target word
 */
export function isWordMatch(
  spoken: string,
  targetWord: string,
  plainWord?: string,
  parts?: string[]
): boolean {
  const normSpoken = normalizeArabicText(spoken);
  const normTarget = normalizeArabicText(targetWord);
  const normPlain = plainWord ? normalizeArabicText(plainWord) : normTarget;

  if (!normSpoken) return false;

  // Direct equality
  if (normSpoken === normTarget || normSpoken === normPlain) return true;

  // Spoken contains the target word (e.g. child said "هذا قمر" or "قمر")
  if (normSpoken.includes(normTarget) || normSpoken.includes(normPlain)) return true;

  // Check word tokens in spoken text
  const tokens = getArabicTokens(normSpoken);
  if (tokens.includes(normTarget) || tokens.includes(normPlain)) return true;

  // If parts joined without dashes equals spoken
  if (parts) {
    const joinedParts = normalizeArabicText(parts.join(''));
    if (normSpoken === joinedParts || normSpoken.includes(joinedParts)) return true;
  }

  // High similarity check (phonetic tolerance for kid speech)
  const sim = Math.max(
    calculateArabicSimilarity(normSpoken, normTarget),
    calculateArabicSimilarity(normSpoken, normPlain)
  );

  return sim >= 0.72;
}

/**
 * LEVEL 2: Check if spoken text matches the target sentence
 */
export function isSentenceMatch(
  spoken: string,
  targetSentence: string,
  targetParts: string[]
): boolean {
  const normSpoken = normalizeArabicText(spoken);
  const normTarget = normalizeArabicText(targetSentence);

  if (!normSpoken) return false;

  // Exact or containment
  if (normSpoken === normTarget || normSpoken.includes(normTarget)) return true;
  if (normTarget.includes(normSpoken) && normSpoken.length >= normTarget.length * 0.8) return true;

  // Check how many sentence words were recognized
  const normParts = targetParts.map((p) => normalizeArabicText(p)).filter(Boolean);
  const spokenTokens = getArabicTokens(normSpoken);

  let matchedPartsCount = 0;
  for (const part of normParts) {
    const partTokens = part.split(' ').filter(Boolean);
    const hasAllPartTokens = partTokens.every(
      (pt) => normSpoken.includes(pt) || spokenTokens.some((st) => calculateArabicSimilarity(st, pt) >= 0.75)
    );
    if (hasAllPartTokens) {
      matchedPartsCount++;
    }
  }

  // If at least 70% of parts matched (e.g. 2 out of 3, or 3 out of 4)
  if (matchedPartsCount >= Math.ceil(normParts.length * 0.7)) {
    return true;
  }

  // General similarity check
  const sim = calculateArabicSimilarity(normSpoken, normTarget);
  return sim >= 0.65;
}

/**
 * LEVEL 3: Check if spoken text matches the story or its sentences
 */
export function isStoryMatch(
  spoken: string,
  storyText: string,
  sentenceParts: string[]
): { isFullMatch: boolean; matchedSentenceIndices: number[] } {
  const normSpoken = normalizeArabicText(spoken);
  const normStory = normalizeArabicText(storyText);

  if (!normSpoken) {
    return { isFullMatch: false, matchedSentenceIndices: [] };
  }

  // Check which individual sentences are present in the spoken text
  const matchedSentenceIndices: number[] = [];

  sentenceParts.forEach((sentence, idx) => {
    const normSent = normalizeArabicText(sentence);
    // Check direct inclusion or token overlap
    if (normSpoken.includes(normSent)) {
      matchedSentenceIndices.push(idx);
      return;
    }

    const sentTokens = getArabicTokens(normSent);
    const spokenTokens = getArabicTokens(normSpoken);

    let matchCount = 0;
    for (const token of sentTokens) {
      if (spokenTokens.some((st) => st === token || calculateArabicSimilarity(st, token) >= 0.8)) {
        matchCount++;
      }
    }

    if (matchCount >= Math.ceil(sentTokens.length * 0.6)) {
      matchedSentenceIndices.push(idx);
    }
  });

  // Full story match if:
  // 1. Spoken contains or is very similar to the entire story
  // 2. Or child recited at least 2 key sentences of the story (since story has 4 sentences)
  const fullSim = calculateArabicSimilarity(normSpoken, normStory);
  const isFullMatch =
    fullSim >= 0.58 ||
    normSpoken.includes(normStory) ||
    matchedSentenceIndices.length >= 2;

  return { isFullMatch, matchedSentenceIndices };
}
