/**
 * Enhanced Sound & Phonetics Engine
 * - High-clarity Arabic phoneme articulation
 * - Offline Web Audio harmonic chords & acoustic feedback
 * - Real-time audio frequency analysis for live waveform visualization
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

let sequenceTimer: any = null;
let activeSequenceId = 0;

/**
 * Stop any active speech and clear sequence timers
 */
export function stopAllSpeech() {
  activeSequenceId++;
  if (sequenceTimer) {
    clearTimeout(sequenceTimer);
    sequenceTimer = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Normalizes Arabic text for Text-to-Speech (TTS):
 * Fixes the issue where browser speech synthesis engines (Google TTS, Chrome, Android, etc.)
 * pronounce Arabic tanween (ـً, ـٌ, ـٍ) mistakenly as "نُونَيْن" (noonayn / two noons) or spell it out.
 * 
 * Phonetically in Arabic:
 * - Tanween is a single nun saakinah (نون ساكنة واحدة):
 *   - Tanween Damm (ـٌ) -> ضمة + نون ساكنة (ـُنْ)
 *   - Tanween Fath (ـً / ـاً / ـًا) -> فتحة + نون ساكنة (ـَنْ)
 *   - Tanween Kasr (ـٍ) -> كسرة + نون ساكنة (ـِنْ)
 *   - Taa Marbuta with tanween (ةٌ, ةً, ةٍ) -> (تُنْ, تَنْ, تِنْ)
 * 
 * This ensures the SpeechSynthesis engine articulates a single natural, crisp noon (ـُنْ / ـَنْ / ـِنْ)
 * without ever pronouncing "نونين" or doubling.
 */
export function normalizeArabicForTTS(text: string): string {
  if (!text) return '';
  let s = text;

  // 1. Remove kashida (tatweel) and hyphens
  s = s.replace(/[ـ\-]/g, '');

  // 2. Handle Taa Marbuta with Tanween before general tanween
  s = s.replace(/ة\u064C/g, 'تُنْ');
  s = s.replace(/ة\u064B/g, 'تَنْ');
  s = s.replace(/ة\u064D/g, 'تِنْ');

  // 3. Handle Tanween Fath (ـاً, ـًا, or solitary ـً like مَاءً)
  s = s.replace(/([^\s])\u064Bا/g, '$1َنْ');
  s = s.replace(/([^\s])ا\u064B/g, '$1َنْ');
  s = s.replace(/\u064B/g, 'َنْ');

  // 4. Handle Tanween Damm (ـٌ) -> ُنْ (single damma + single noon with sukoon)
  s = s.replace(/\u064C/g, 'ُنْ');

  // 5. Handle Tanween Kasr (ـٍ) -> ِنْ (single kasra + single noon with sukoon)
  s = s.replace(/\u064D/g, 'ِنْ');

  // 6. Deduplicate any consecutive noons with sukoon
  s = s.replace(/نْ+/g, 'نْ');

  return s;
}

/**
 * Internal speech synthesizer helper
 */
function speakInternal(text: string, options?: { rate?: number; pitch?: number; onEnd?: () => void }) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    const phoneticText = normalizeArabicForTTS(text);
    const utterance = new SpeechSynthesisUtterance(phoneticText);
    utterance.lang = 'ar-SA';
    utterance.rate = options?.rate ?? 0.82; // Slightly slowed down for optimal phonetic clarity
    utterance.pitch = options?.pitch ?? 1.05; // Bright, friendly pitch

    const voices = window.speechSynthesis.getVoices();
    // Prioritize natural Arabic voices (Google, Maged, Laila, Tarik, Siri, etc.)
    const arabicVoice = voices.find(v => v.lang.startsWith('ar') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Maged') || v.name.includes('Tarik') || v.name.includes('Laila'))) ||
      voices.find(v => v.lang.startsWith('ar'));

    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    if (options?.onEnd) {
      utterance.onend = options.onEnd;
      utterance.onerror = options.onEnd;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    if (options?.onEnd) options.onEnd();
  }
}

/**
 * High-quality Arabic Speech Synthesis
 */
export function speakArabic(text: string, options?: { rate?: number; pitch?: number; onEnd?: () => void }) {
  stopAllSpeech();
  speakInternal(text, options);
}

/**
 * Pronounce syllables or scrambled tiles sequentially with clear pauses and step highlighting
 */
export function speakSyllablesSequential(
  parts: string[],
  onComplete?: () => void,
  rate = 0.8,
  onStep?: (index: number) => void
) {
  stopAllSpeech();
  const currentSeqId = activeSequenceId;

  if (!parts || parts.length === 0) {
    if (onStep) onStep(-1);
    if (onComplete) onComplete();
    return;
  }

  let currentIndex = 0;

  function speakNext() {
    if (activeSequenceId !== currentSeqId) return;

    if (currentIndex >= parts.length) {
      if (onStep) onStep(-1);
      if (onComplete) onComplete();
      return;
    }

    if (onStep) onStep(currentIndex);

    const cleanPart = parts[currentIndex].replace(/[ـ\-]/g, '');
    playTileSnapSound();

    speakInternal(cleanPart, {
      rate: rate,
      pitch: 1.05,
      onEnd: () => {
        if (activeSequenceId !== currentSeqId) return;
        currentIndex++;
        sequenceTimer = setTimeout(speakNext, 380);
      },
    });
  }

  speakNext();
}

/**
 * Harmonic Celebration / Success Chime (Web Audio - 100% Offline)
 */
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Major Triad)
    const now = ctx.currentTime;

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.65);
    });
  } catch (e) {
    console.warn('AudioContext playback issue:', e);
  }
}

/**
 * Encouraging Try-Again Sound (Web Audio - 100% Offline)
 */
export function playRetrySound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.3);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) {
    console.warn(e);
  }
}

/**
 * Tactile Tile Snap Pop
 */
export function playTileSnapSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  } catch (e) {
    // Ignore audio context errors
  }
}

/**
 * Voice Listening Beep
 */
export function playMicPing(isStart: boolean) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isStart ? 600 : 400, now);
    osc.frequency.exponentialRampToValueAtTime(isStart ? 900 : 300, now + 0.1);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  } catch (e) {
    // Ignore
  }
}
