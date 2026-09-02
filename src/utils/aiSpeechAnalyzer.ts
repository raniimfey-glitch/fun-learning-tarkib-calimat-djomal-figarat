import { AIPronunciationFeedback } from '../types';

/**
 * AI Real-time Speech & Pronunciation Analyzer
 * Connects with server-side Gemini 3.7 Flash when online,
 * or gracefully runs offline phonetic grading when disconnected.
 */
export async function analyzePronunciation(
  spokenText: string,
  targetWord: string,
  targetParts: string[]
): Promise<AIPronunciationFeedback> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (isOnline) {
    try {
      const response = await fetch('/api/analyze-pronunciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spokenText,
          targetWord,
          targetParts,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data as AIPronunciationFeedback;
      }
    } catch (err) {
      console.warn('Online AI analysis failed, falling back to offline evaluator:', err);
    }
  }

  // Offline intelligent phonetic evaluation fallback
  return evaluateOfflinePronunciation(spokenText, targetWord, targetParts);
}

/**
 * Offline Intelligent Arabic Phonetic Evaluator
 */
function evaluateOfflinePronunciation(
  spoken: string,
  target: string,
  parts: string[]
): AIPronunciationFeedback {
  const cleanSpoken = normalizeArabic(spoken);
  const cleanTarget = normalizeArabic(target);

  const similarity = calculateSimilarity(cleanSpoken, cleanTarget);
  const score = Math.round(similarity * 100);

  let accuracy: 'ممتاز' | 'جيد جداً' | 'جيد' | 'حاول مجدداً' = 'حاول مجدداً';
  let feedback = 'حاول نطق الكلمة بوضوح أكثر مع إبراز الحروف والمقاطع.';
  let encouragement = 'أنت رائع، استمر في المحاولة!';

  if (score >= 85) {
    accuracy = 'ممتاز';
    feedback = 'نطق متقن ومخارج حروف واضحة جداً!';
    encouragement = 'أداء صوتي مذهل! 🌟';
  } else if (score >= 65) {
    accuracy = 'جيد جداً';
    feedback = 'نطق جيد جداً، انتبه لمدود الحروف والتشكيل.';
    encouragement = 'قريب جداً من الإتقان التام! 👏';
  } else if (score >= 40) {
    accuracy = 'جيد';
    feedback = 'بداية جيدة، ركز على نطق المقاطع الأولى بانسيابية.';
    encouragement = 'واصل التمرين خطوة بخطوة! 👍';
  }

  const phoneticBreakdown = parts.map((part) => {
    const cleanPart = normalizeArabic(part);
    const matched = cleanSpoken.includes(cleanPart);
    return {
      syllable: part,
      status: (matched ? 'correct' : 'needs_work') as 'correct' | 'needs_work',
      tip: matched ? 'مخرج صوتي سليم' : 'ركز على تبيين صوت هذا المقطع',
    };
  });

  return {
    score,
    accuracy,
    feedback,
    detectedWord: spoken || '(صوت غير مسموع بوضوح)',
    phoneticBreakdown,
    encouragement,
    isOfflineFallback: true,
  };
}

function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove tashkeel / harakat
    .replace(/[ـ]/g, '') // Remove tatweel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim()
    .toLowerCase();
}

function calculateSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  let matches = 0;
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) {
      matches++;
    }
  }

  return matches / longer.length;
}
