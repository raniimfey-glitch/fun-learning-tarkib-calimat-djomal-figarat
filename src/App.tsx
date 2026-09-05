import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  Star,
  ArrowLeft,
  RotateCcw,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LevelId, Question, PlacedTile, AIPronunciationFeedback } from './types';
import { LEVEL_CONFIGS, INITIAL_DATA } from './data/learningData';
import {
  speakArabic,
  speakSyllablesSequential,
  stopAllSpeech,
  playSuccessChime,
  playRetrySound,
  playTileSnapSound,
} from './utils/soundEngine';
import { analyzePronunciation } from './utils/aiSpeechAnalyzer';
import { useSmartVoiceInput } from './hooks/useSmartVoiceInput';
import { VoiceCountdownIndicator } from './components/VoiceCountdownIndicator';
import { AudioVisualizer } from './components/AudioVisualizer';
import { AIPronunciationSheet } from './components/AIPronunciationSheet';
import { CelebrationModal } from './components/CelebrationModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { SplashScreen } from './components/SplashScreen';
import { normalizeArabicText } from './utils/arabicMatcher';

/**
 * Shuffles parts ensuring they are strictly randomized and NEVER remain in their original sorted order.
 * Guarantees that no sentence in Level 2 (or multi-part question) ever appears pre-solved.
 */
function shuffleTilesStrict(parts: string[]): string[] {
  if (!parts || parts.length <= 1) return parts ? [...parts] : [];

  let result = [...parts];
  let attempts = 0;

  // Run Fisher-Yates shuffle until the sequence strictly differs from original
  while (attempts < 50) {
    result = [...parts];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }

    // Condition 1: Must never be identical to original sorted order
    const isIdentical = result.every((val, idx) => val === parts[idx]);

    // Condition 2: For 3 or more items, avoid having the first item stay in place
    const startsWithSame = parts.length >= 3 ? result[0] === parts[0] : false;

    if (!isIdentical && !startsWithSame) {
      return result;
    }

    if (attempts > 15 && !isIdentical) {
      return result;
    }

    attempts++;
  }

  // Deterministic fallback: rotate elements to guarantee scramble
  if (result.every((val, idx) => val === parts[idx])) {
    return [...parts.slice(1), parts[0]];
  }

  return result;
}

// Vibrant toy-tile colors for scrambled blocks
const TILE_COLOR_SCHEMES = [
  {
    bg: 'bg-gradient-to-b from-rose-50 to-pink-100',
    border: 'border-rose-400 border-b-rose-500',
    text: 'text-rose-950',
    shadow: 'hover:shadow-rose-300/50',
  },
  {
    bg: 'bg-gradient-to-b from-amber-50 to-yellow-100',
    border: 'border-amber-400 border-b-amber-500',
    text: 'text-amber-950',
    shadow: 'hover:shadow-amber-300/50',
  },
  {
    bg: 'bg-gradient-to-b from-sky-50 to-cyan-100',
    border: 'border-sky-400 border-b-sky-500',
    text: 'text-sky-950',
    shadow: 'hover:shadow-sky-300/50',
  },
  {
    bg: 'bg-gradient-to-b from-emerald-50 to-teal-100',
    border: 'border-emerald-400 border-b-emerald-500',
    text: 'text-emerald-950',
    shadow: 'hover:shadow-emerald-300/50',
  },
  {
    bg: 'bg-gradient-to-b from-purple-50 to-fuchsia-100',
    border: 'border-purple-400 border-b-purple-500',
    text: 'text-purple-950',
    shadow: 'hover:shadow-purple-300/50',
  },
];

export default function App() {
  // State: 2 Levels (1 = Syllables->Word, 2 = Words->Sentence)
  const [level, setLevel] = useState<LevelId>(1);
  const [questionsData] = useState<Record<number, Question[]>>(INITIAL_DATA);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [placedTiles, setPlacedTiles] = useState<PlacedTile[]>([]);
  const [shuffledTiles, setShuffledTiles] = useState<string[]>([]);
  const [answeredState, setAnsweredState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeReadingIndex, setActiveReadingIndex] = useState<number | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // AI Pronunciation State
  const [aiFeedback, setAiFeedback] = useState<AIPronunciationFeedback | null>(null);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);

  // Unlocked levels progression: Level 1 unlocked by default. Level 2 unlocks only after completing Level 1. Level 3 unlocks only after completing Level 2.
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('arabic_app_unlocked_levels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.includes(1)) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
    return [1];
  });

  const unlockLevel = useCallback((levelToUnlock: number) => {
    setUnlockedLevels((prev) => {
      if (prev.includes(levelToUnlock)) return prev;
      const updated = [...prev, levelToUnlock];
      try {
        localStorage.setItem('arabic_app_unlocked_levels', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  }, []);

  // Dynamic Full-Screen Startup Intro Sequence:
  // Step 1: Icon fills screen (الأيقونة تملأ الشاشة)
  // Step 2: Redesigned Welcome Screen (الشاشة الترحيبية المستحدثة) for 5 seconds
  // Step 3: Direct transition to Main App Interface
  const [introState, setIntroState] = useState<{
    isOpen: boolean;
    initialStage: 'icon' | 'welcome';
  }>({
    isOpen: true,
    initialStage: 'icon',
  });

  // Open Splash Screen safely (stopping any ongoing speech audio)
  const handleOpenSplash = useCallback(() => {
    stopAllSpeech();
    setIsPlayingAudio(false);
    setActiveReadingIndex(null);
    setIntroState({ isOpen: true, initialStage: 'welcome' });
  }, []);

  const currentQuestions = questionsData[level] || INITIAL_DATA[1];
  const currentQ = currentQuestions[questionIndex] || currentQuestions[0];
  const levelConfig = LEVEL_CONFIGS[level];

  // Close Splash Screen and enter main app interface
  const handleCloseSplash = useCallback(() => {
    setIntroState((prev) => ({ ...prev, isOpen: false }));
    stopAllSpeech();
    setIsPlayingAudio(false);
    setActiveReadingIndex(null);
  }, []);

  // Initialize and shuffle question (Manual pronunciation only upon clicking the listen button)
  const initQuestion = useCallback((q: Question) => {
    stopAllSpeech();
    setIsPlayingAudio(false);
    setActiveReadingIndex(null);
    setPlacedTiles([]);
    setAnsweredState('idle');
    setAiFeedback(null);
    setActionFeedback(null);
    const shuffled = shuffleTilesStrict(q.parts);
    setShuffledTiles(shuffled);
  }, []);

  useEffect(() => {
    if (currentQ) {
      initQuestion(currentQ);
    }
  }, [level, questionIndex, currentQ, initQuestion]);

  // Audio Pronunciation Trigger: activates strictly upon clicking the sound button
  const handlePlaySound = useCallback(() => {
    if (!currentQ) return;
    stopAllSpeech();
    setIsPlayingAudio(true);

    if (answeredState === 'correct') {
      setActiveReadingIndex(null);
      setActionFeedback(
        level === 3
          ? '🔊 اِسْتَمِعْ لِلْقِصَّةِ'
          : level === 2
          ? '🔊 اِسْتَمِعْ لِلْجُمْلَةِ'
          : '🔊 اِسْتَمِعْ لِلْكَلِمَةِ'
      );
      speakArabic(currentQ.word, {
        rate: level === 3 ? 0.9 : 0.82,
        onEnd: () => {
          setIsPlayingAudio(false);
          setActiveReadingIndex(null);
          setTimeout(() => setActionFeedback(null), 1500);
        },
      });
    } else {
      setActionFeedback(
        level === 1
          ? '🔊 اِسْتَمِعْ لِلْمَقَاطِعِ'
          : level === 2
          ? '🔊 اِسْتَمِعْ لِلْكَلِمَاتِ'
          : '🔊 اِسْتَمِعْ لِلْجُمَلِ'
      );
      const partsToSpeak = shuffledTiles.length > 0 ? shuffledTiles : currentQ.parts;
      speakSyllablesSequential(
        partsToSpeak,
        () => {
          setIsPlayingAudio(false);
          setActiveReadingIndex(null);
          setTimeout(() => setActionFeedback(null), 1500);
        },
        level === 3 ? 0.85 : 0.8,
        (stepIndex) => {
          setActiveReadingIndex(stepIndex >= 0 ? stepIndex : null);
        }
      );
    }
  }, [currentQ, answeredState, level, shuffledTiles]);

  // Verify Answer with Confetti & Sounds
  const handleVerify = useCallback(() => {
    if (!currentQ || answeredState !== 'idle') return;
    stopAllSpeech();
    setIsPlayingAudio(false);
    setActiveReadingIndex(null);

    const userText = placedTiles.map((t) => t.text).join('|');
    const correctText = currentQ.parts.join('|');
    const isExactMatch = userText === correctText;
    const isNormalizedMatch =
      placedTiles.length === currentQ.parts.length &&
      normalizeArabicText(placedTiles.map((t) => t.text).join('')) ===
        normalizeArabicText(currentQ.parts.join(''));
    const isCorrect = isExactMatch || isNormalizedMatch;

    if (isCorrect) {
      setAnsweredState('correct');
      setScore((prev) => prev + 1);
      playSuccessChime();

      // Confetti burst for kid joy!
      try {
        confetti({
          particleCount: 55,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A06CD5', '#FF9F1C'],
        });
      } catch (e) {
        // ignore
      }

      setActionFeedback('🌟 أَحْسَنْتَ! إِجَابَةٌ صَحِيحَةٌ');
      setTimeout(() => {
        speakArabic(`أَحْسَنْتَ! ${currentQ.word}`);
      }, 350);
    } else {
      setAnsweredState('wrong');
      playRetrySound();
      setActionFeedback('❌ حَاوِلْ مَرَّةً أُخْرَى يَا بَطَلُ!');
    }
  }, [currentQ, answeredState, placedTiles]);

  // Next Question Button Handler
  const handleNext = useCallback(() => {
    stopAllSpeech();
    setIsPlayingAudio(false);
    setActiveReadingIndex(null);
    if (questionIndex + 1 < currentQuestions.length) {
      setQuestionIndex((prev) => prev + 1);
      setActionFeedback('السُّؤَالُ التَّالِي');
    } else {
      // Completed the level! Unlock next level
      setShowCelebration(true);
      if (level === 1) {
        unlockLevel(2);
      } else if (level === 2) {
        unlockLevel(3);
      }
    }
  }, [questionIndex, currentQuestions.length, level, unlockLevel]);

  // Previous Question
  const handlePrevious = useCallback(() => {
    stopAllSpeech();
    setIsPlayingAudio(false);
    setActiveReadingIndex(null);
    if (questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
      setActionFeedback('السُّؤَالُ السَّابِقُ');
    }
  }, [questionIndex]);

  // Clear / Retry
  const handleRetry = useCallback(() => {
    stopAllSpeech();
    setIsPlayingAudio(false);
    setActiveReadingIndex(null);
    setPlacedTiles([]);
    setAnsweredState('idle');
    playTileSnapSound();
    setActionFeedback('أَعِدِ التَّرْتِيبَ');
    if (currentQ) {
      setShuffledTiles(shuffleTilesStrict(currentQ.parts));
    }
  }, [currentQ]);

  // Switch Level with strict lock check
  const handleSwitchLevel = useCallback(
    (newLevel: LevelId) => {
      if (!unlockedLevels.includes(newLevel)) {
        playRetrySound();
        if (newLevel === 2) {
          setActionFeedback('🔒 أَكْمِلِ المُسْتَوَى الأَوَّلَ أَوَّلاً لِفَتْحِ المُسْتَوَى الثَّانِي');
        } else if (newLevel === 3) {
          setActionFeedback('🔒 أَكْمِلِ المُسْتَوَى الثَّانِيَ أَوَّلاً لِفَتْحِ المُسْتَوَى الثَّالِثِ');
        }
        setTimeout(() => setActionFeedback(null), 3000);
        return;
      }
      stopAllSpeech();
      setIsPlayingAudio(false);
      setActiveReadingIndex(null);
      setLevel(newLevel);
      setQuestionIndex(0);
      setScore(0);
      setShowCelebration(false);
    },
    [unlockedLevels]
  );

  // Tile Placement
  const handlePlaceTile = useCallback(
    (tileText: string, originalIndex: number) => {
      if (answeredState === 'correct') return;

      const isAlreadyPlaced = placedTiles.some((t) => t.originalIndex === originalIndex);
      if (isAlreadyPlaced) return;

      stopAllSpeech();
      setIsPlayingAudio(false);
      setActiveReadingIndex(null);

      playTileSnapSound();
      speakArabic(tileText.replace(/[ـ\-]/g, ''));
      const nextPlaced = [
        ...placedTiles,
        { id: `tile-${Date.now()}-${originalIndex}`, text: tileText, originalIndex },
      ];
      setPlacedTiles(nextPlaced);

      // In Level 1: When placing the last syllable, the syllables connect into the word!
      // If the syllables form the correct word, celebrate immediately:
      if (level === 1 && currentQ && nextPlaced.length === currentQ.parts.length) {
        const userText = nextPlaced.map((t) => t.text).join('|');
        const correctText = currentQ.parts.join('|');
        const isMatch =
          userText === correctText ||
          normalizeArabicText(nextPlaced.map((t) => t.text).join('')) ===
            normalizeArabicText(currentQ.parts.join(''));
        if (isMatch) {
          setTimeout(() => {
            setAnsweredState('correct');
            setScore((prev) => prev + 1);
            playSuccessChime();
            try {
              confetti({
                particleCount: 55,
                spread: 70,
                origin: { y: 0.65 },
                colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A06CD5', '#FF9F1C'],
              });
            } catch (e) {
              // ignore
            }
            setActionFeedback('✨ أَحْسَنْتَ! كَلِمَةٌ صَحِيحَةٌ وَمُتَّصِلَةٌ');
            setTimeout(() => {
              speakArabic(`أَحْسَنْتَ! ${currentQ.word}`);
            }, 300);
          }, 350);
        }
      }
    },
    [answeredState, placedTiles, level, currentQ]
  );

  // Return Placed Tile back to pool
  const handleReturnTile = useCallback(
    (placedIndex: number) => {
      if (answeredState === 'correct') return;
      stopAllSpeech();
      setIsPlayingAudio(false);
      setActiveReadingIndex(null);
      playTileSnapSound();
      setPlacedTiles((prev) => prev.filter((_, idx) => idx !== placedIndex));
    },
    [answeredState]
  );

  // Smart Voice Input Correct Answer Handler (Words, Sentences, and Story Paragraphs)
  const handleVoiceCorrectAnswer = useCallback(
    (matchedIndices?: number[]) => {
      if (!currentQ || answeredState === 'correct') return;
      stopAllSpeech();
      setIsPlayingAudio(false);
      setActiveReadingIndex(null);

      // Full match for Words, Sentences, or Full Story
      if (!matchedIndices || matchedIndices.length >= currentQ.parts.length) {
        const solvedTiles: PlacedTile[] = currentQ.parts.map((part, idx) => ({
          id: `voice-tile-${Date.now()}-${idx}`,
          text: part,
          originalIndex: idx,
        }));

        setPlacedTiles(solvedTiles);
        setAnsweredState('correct');
        setScore((prev) => prev + 1);
        playSuccessChime();

        try {
          confetti({
            particleCount: 65,
            spread: 80,
            origin: { y: 0.65 },
            colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A06CD5', '#FF9F1C'],
          });
        } catch (e) {
          // ignore
        }

        const praiseText =
          level === 1
            ? `أَحْسَنْتَ! إِجَابَةٌ صَوْتِيَّةٌ صَحِيحَةٌ: ${currentQ.word}`
            : level === 2
            ? `رَائِعٌ جِدّاً! إِجَابَةٌ صَوْتِيَّةٌ مُتْقَنَةٌ: ${currentQ.word}`
            : `بَطَلٌ مُمَيَّزٌ! قِرَاءَةٌ صَوْتِيَّةٌ رَائِعَةٌ لِلْقِصَّةِ!`;

        setActionFeedback(`🌟 رَائِعٌ! إِجَابَةٌ صَوْتِيَّةٌ صَحِيحَةٌ: ${currentQ.word}`);
        setTimeout(() => {
          speakArabic(praiseText);
        }, 350);

        // Perform AI feedback grading in background
        analyzePronunciation(currentQ.word, currentQ.word, currentQ.parts)
          .then((fb) => setAiFeedback(fb))
          .catch(() => {});
      } else {
        // Partial story sentence matching: sequentially add the recognized sentences
        setPlacedTiles((prev) => {
          const nextPlaced = [...prev];
          matchedIndices.forEach((targetIdx) => {
            if (!nextPlaced.some((t) => t.originalIndex === targetIdx)) {
              nextPlaced.push({
                id: `voice-tile-${Date.now()}-${targetIdx}`,
                text: currentQ.parts[targetIdx],
                originalIndex: targetIdx,
              });
            }
          });

          if (nextPlaced.length === currentQ.parts.length) {
            setAnsweredState('correct');
            setScore((s) => s + 1);
            playSuccessChime();
            try {
              confetti({
                particleCount: 65,
                spread: 80,
                origin: { y: 0.65 },
                colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A06CD5', '#FF9F1C'],
              });
            } catch (e) {}
            setActionFeedback(`🌟 رَائِعٌ! اكْتَمَلَتِ القِصَّةُ صَوْتِيّاً!`);
            setTimeout(() => {
              speakArabic(`بَطَلٌ مُمَيَّزٌ! اكْتَمَلَتْ جُمَلُ القِصَّةِ صَوْتِيّاً.`);
            }, 350);
          } else {
            playTileSnapSound();
            setActionFeedback(`✨ تَمَّ تَرْكِيبُ الجُمْلَةِ صَوْتِيّاً، وَاصِلِ القِرَاءَةَ!`);
          }
          return nextPlaced;
        });
      }
    },
    [currentQ, answeredState, level]
  );

  // 15-second countdown timeout handler
  const handleVoiceTimeout = useCallback(() => {
    playRetrySound();
    setActionFeedback('⌛ انْتَهَى الوَقْتُ (15 ثَانِيَة)! حَاوِلْ مَرَّةً أُخْرَى أَوْ رَتِّبِ البِطَاقَاتِ بِيَدِكَ.');
  }, []);

  // Microphone error handler
  const handleVoiceError = useCallback((errMsg: string) => {
    setActionFeedback(`⚠️ ${errMsg}`);
  }, []);

  // Smart Voice Input Hook with 15-Second Countdown
  const {
    isListening,
    countdown,
    liveTranscript,
    toggleListening,
    stopListening,
  } = useSmartVoiceInput({
    currentQ,
    level,
    onCorrectAnswer: handleVoiceCorrectAnswer,
    onTimeout: handleVoiceTimeout,
    onError: handleVoiceError,
  });

  const allTilesPlaced = placedTiles.length === currentQ.parts.length;
  const earnedStars = score >= 8 ? 3 : score >= 5 ? 2 : score >= 2 ? 1 : 0;
  const progressPercent = ((questionIndex + 1) / currentQuestions.length) * 100;

  // Render Splash Screen directly during intro sequence so app activities never flash first
  if (introState.isOpen) {
    return (
      <SplashScreen
        isOpen={true}
        initialStage={introState.initialStage}
        onClose={handleCloseSplash}
      />
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="min-h-screen bg-gradient-to-br from-[#FFF5F9] via-[#F0F7FF] to-[#FFFDF0] p-3 sm:p-6 flex flex-col justify-between select-none text-slate-900 relative overflow-hidden font-sans"
      dir="rtl"
    >
      {/* ── BACKGROUND FLOATING TOY DECORATIONS ── */}
      <div className="absolute top-4 left-6 text-3xl sm:text-4xl opacity-40 animate-soft-float pointer-events-none select-none">
        ☁️
      </div>
      <div className="absolute top-16 right-6 text-2xl sm:text-3xl opacity-40 animate-float-reverse pointer-events-none select-none">
        ⭐
      </div>
      <div className="absolute bottom-24 left-8 text-2xl sm:text-3xl opacity-30 animate-bounce-slow pointer-events-none select-none">
        🎈
      </div>
      <div className="absolute bottom-16 right-10 text-3xl sm:text-4xl opacity-30 animate-soft-float pointer-events-none select-none">
        ✨
      </div>

      {/* ── PWA IN-APP INSTALL PROMPT (Auto-hidden if standalone/installed) ── */}
      <PWAInstallButton />

      {/* ── TOP HEADER: Logo, Mascot, Stars Counter ── */}
      <header className="w-full max-w-xl mx-auto mb-3 sm:mb-4 relative z-10">
        {/* Main Header Bar */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-3.5 sm:p-4 shadow-xl shadow-purple-500/5 flex items-center justify-between mb-3 border-2 border-purple-100">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={handleOpenSplash}
              animate={{
                y: [0, -4, 0],
                rotate: [-1.5, 1.5, -1.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              whileHover={{ scale: 1.08, rotate: 0 }}
              whileTap={{ scale: 0.92 }}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shadow-md shadow-orange-500/20 border-2 border-white shrink-0 bg-amber-100 cursor-pointer transition-shadow hover:shadow-lg hover:shadow-purple-500/25 text-right relative group"
              title="فَتْحُ شَاشَةِ التَّرْحِيبِ"
            >
              <img
                src="/app-icon.jpg"
                alt="أيقونة تركيب كلمات وجمل وفقرات"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span className="absolute -top-1 -right-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                ✨
              </span>
            </motion.button>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900">
                  تَرْكِيبُ كَلِمَاتٍ وَجُمَلٍ وَفِقْرَاتٍ
                </h1>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-500 mt-0.5">
                تَعَلَّمِ القِرَاءَةَ وَالتَّرْكِيبَ بِمَرَحٍ
              </p>
            </div>
          </div>

          {/* Golden Stars Pill & Splash trigger */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-100 px-3.5 py-2 rounded-2xl border-2 border-amber-300 shadow-sm">
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${
                      s <= earnedStars
                        ? 'text-amber-400 fill-amber-400 drop-shadow-sm scale-110'
                        : 'text-slate-300 fill-slate-100'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs sm:text-sm font-black text-amber-900 bg-white/90 px-2 py-0.5 rounded-xl border border-amber-200">
                {score} نُقْطَة
              </span>
            </div>

            <button
              onClick={handleOpenSplash}
              className="p-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 shadow-xs transition-colors shrink-0 cursor-pointer"
              title="شَاشَةُ التَّرْحِيبِ"
            >
              <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
            </button>
          </div>
        </div>

        {/* 3 Levels Switcher Tabs with 3D Toy Button effect */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          <button
            onClick={() => handleSwitchLevel(1)}
            className={`py-2.5 sm:py-3 px-2 rounded-2xl font-black text-xs sm:text-sm md:text-base transition-all shadow-md flex flex-col items-center justify-center border-b-4 active:translate-y-1 active:border-b-0 ${
              level === 1
                ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white border-rose-700 shadow-orange-500/25'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg">🧩</span>
              <span>المستوى الأول</span>
            </div>
            <span
              className={`text-[11px] sm:text-xs font-extrabold mt-0.5 whitespace-nowrap ${
                level === 1 ? 'text-amber-100' : 'text-slate-500'
              }`}
            >
              مَقَاطِعُ ← كَلِمَةٌ
            </span>
          </button>

          <button
            onClick={() => handleSwitchLevel(2)}
            className={`py-2.5 sm:py-3 px-2 rounded-2xl font-black text-xs sm:text-sm md:text-base transition-all shadow-md flex flex-col items-center justify-center border-b-4 active:translate-y-1 active:border-b-0 relative ${
              !unlockedLevels.includes(2)
                ? 'bg-slate-100 text-slate-400 border-slate-300 hover:bg-slate-200/80 shadow-none'
                : level === 2
                ? 'bg-gradient-to-br from-purple-500 via-indigo-600 to-sky-600 text-white border-indigo-800 shadow-indigo-500/25'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg">
                {!unlockedLevels.includes(2) ? '🔒' : '📚'}
              </span>
              <span>المستوى الثاني</span>
            </div>
            <span
              className={`text-[11px] sm:text-xs font-extrabold mt-0.5 whitespace-nowrap ${
                !unlockedLevels.includes(2)
                  ? 'text-slate-400'
                  : level === 2
                  ? 'text-sky-100'
                  : 'text-slate-500'
              }`}
            >
              كَلِمَاتٌ ← جُمْلَةٌ
            </span>
          </button>

          <button
            onClick={() => handleSwitchLevel(3)}
            className={`py-2.5 sm:py-3 px-2 rounded-2xl font-black text-xs sm:text-sm md:text-base transition-all shadow-md flex flex-col items-center justify-center border-b-4 active:translate-y-1 active:border-b-0 relative ${
              !unlockedLevels.includes(3)
                ? 'bg-slate-100 text-slate-400 border-slate-300 hover:bg-slate-200/80 shadow-none'
                : level === 3
                ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-white border-teal-800 shadow-teal-500/25'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg">
                {!unlockedLevels.includes(3) ? '🔒' : '📖'}
              </span>
              <span>المستوى الثالث</span>
            </div>
            <span
              className={`text-[11px] sm:text-xs font-extrabold mt-0.5 whitespace-nowrap ${
                !unlockedLevels.includes(3)
                  ? 'text-slate-400'
                  : level === 3
                  ? 'text-teal-100'
                  : 'text-slate-500'
              }`}
            >
              جُمَلٌ ← قِصَّةٌ
            </span>
          </button>
        </div>
      </header>

      {/* ── MAIN QUESTION CARD: Tactile Board ── */}
      <section
        className={`w-full ${
          level === 2 ? 'max-w-2xl' : 'max-w-xl'
        } mx-auto flex-1 flex flex-col justify-center my-1 sm:my-2 relative z-10`}
      >
        <motion.div
          key={`${level}-${questionIndex}`}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="bg-white/95 backdrop-blur-md rounded-[36px] p-5 sm:p-7 shadow-2xl shadow-purple-900/5 border-2 border-purple-100 text-center relative"
        >
          {/* Top Progress Track */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  level === 1
                    ? 'bg-gradient-to-r from-amber-400 to-rose-500 shadow-sm'
                    : level === 2
                    ? 'bg-gradient-to-r from-purple-500 to-sky-500 shadow-sm'
                    : 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-sm'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-600 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
              السُّؤَالُ {questionIndex + 1} مِنْ {currentQuestions.length}
            </span>
          </div>

          {/* Picture / Mascot Pedestal */}
          <div className="relative inline-block mb-2">
            <div
              onClick={handlePlaySound}
              className={`w-32 h-32 sm:w-36 sm:h-36 mx-auto rounded-[30px] shadow-lg flex items-center justify-center text-7xl sm:text-8xl cursor-pointer hover:scale-105 active:scale-95 transition-all border-4 border-white ${
                level === 1
                  ? 'bg-gradient-to-tr from-amber-100 via-orange-100 to-rose-100 ring-4 ring-amber-200/60 shadow-orange-500/10'
                  : level === 2
                  ? 'bg-gradient-to-tr from-purple-100 via-sky-100 to-indigo-100 ring-4 ring-purple-200/60 shadow-purple-500/10'
                  : 'bg-gradient-to-tr from-emerald-100 via-teal-100 to-cyan-100 ring-4 ring-emerald-200/60 shadow-emerald-500/10'
              }`}
              title="اِضْغَطْ لِلاِسْتِمَاعِ"
            >
              <span className="animate-soft-float">{currentQ.emoji}</span>
            </div>
          </div>

          {/* Voice Spectrum Visualizer Waves */}
          <div className="my-1.5 flex justify-center">
            <AudioVisualizer isPlaying={isPlayingAudio} isListening={isListening} />
          </div>

          {/* Level Hint Instruction */}
          <div className="inline-block bg-slate-100/80 px-4 py-1.5 rounded-full text-sm sm:text-base font-black text-slate-700 my-1 border border-slate-200">
            {levelConfig.hint}
          </div>

          {/* ── 15-SECOND VOICE INPUT COUNTDOWN INDICATOR ── */}
          <VoiceCountdownIndicator
            isListening={isListening}
            countdown={countdown}
            liveTranscript={liveTranscript}
            level={level}
            targetHint={currentQ.word}
            onCancel={stopListening}
          />

          {/* ── DROP / COMPOSITION TRAY (Magical Assembly Groove) ── */}
          <div
            className={`min-h-[96px] sm:min-h-[110px] rounded-3xl border-2 border-dashed p-3 sm:p-5 my-3 transition-all flex items-center justify-center ${
              level === 2
                ? 'w-full'
                : 'flex-wrap gap-2.5 sm:gap-3'
            } ${
              answeredState === 'correct'
                ? 'border-emerald-400 bg-emerald-50/90 shadow-md shadow-emerald-500/10'
                : answeredState === 'wrong'
                ? 'border-rose-300 bg-rose-50/90'
                : level === 2
                ? 'border-purple-300 bg-purple-50/40 shadow-inner'
                : 'border-amber-300/80 bg-amber-50/40 shadow-inner'
            }`}
          >
            {level === 3 ? (
              placedTiles.length === 0 ? (
                <div className="flex flex-col gap-2 w-full py-1">
                  {currentQ.parts.map((_, i) => (
                    <div
                      key={i}
                      className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-emerald-300 bg-white/70 flex items-center justify-between text-slate-400 font-bold text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span>الجُمْلَةُ رَقْمُ {i + 1} فِي القِصَّةِ</span>
                      </div>
                      <span className="text-[11px] bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full font-bold">
                        بِانْتِظَارِ التَّرْتِيبِ
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full space-y-2">
                  <AnimatePresence>
                    {placedTiles.map((tile, idx) => (
                      <motion.div
                        key={tile.id}
                        initial={{ scale: 0.9, y: -6, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                        onClick={() => handleReturnTile(idx)}
                        className="w-full p-3 sm:p-3.5 rounded-2xl bg-white border-2 border-teal-400 border-b-4 border-b-teal-600 text-slate-900 font-bold text-base sm:text-lg shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform flex items-center justify-between gap-3 text-right"
                        title="اِضْغَطْ لِإِعَادَةِ هَذِهِ الجُمْلَةِ"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-teal-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{tile.text}</span>
                        </div>
                        {answeredState !== 'correct' && (
                          <span className="w-6 h-6 bg-rose-500 text-white rounded-full text-xs flex items-center justify-center opacity-75 hover:opacity-100 shrink-0">
                            ×
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )
            ) : level === 2 ? (
              /* ── LEVEL 2: WORDS APPEAR WITHOUT CARDS, IN FULL CLARITY AND COMPLETENESS ── */
              <div className="w-full flex flex-col items-center justify-center py-2 px-1">
                {placedTiles.length === 0 ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-purple-500 font-black text-sm sm:text-base text-center py-4 select-none">
                    <span className="text-2xl">✍️</span>
                    <span>اِضْغَطْ عَلَى الكَلِمَاتِ فِي الأَسْفَلِ لِتَرْكِيبِ الجُمْلَةِ هُنَا</span>
                  </div>
                ) : (
                  <div className="w-full flex flex-wrap items-center justify-center gap-x-3.5 sm:gap-x-5 gap-y-2 py-2 px-2 text-center dir-rtl">
                    <AnimatePresence>
                      {placedTiles.map((tile, idx) => (
                        <motion.button
                          key={tile.id}
                          type="button"
                          initial={{ scale: 0.8, y: -6, opacity: 0 }}
                          animate={{ scale: 1, y: 0, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                          onClick={() => handleReturnTile(idx)}
                          className={`group relative inline-flex items-center font-black text-2xl sm:text-3xl md:text-4xl leading-relaxed select-none transition-colors cursor-pointer bg-transparent border-0 p-0 m-0 ${
                            answeredState === 'correct'
                              ? 'text-emerald-700'
                              : answeredState === 'wrong'
                              ? 'text-rose-700'
                              : 'text-slate-900 hover:text-purple-700'
                          }`}
                          title={
                            answeredState === 'correct'
                              ? 'جُمْلَةٌ صَحِيحَةٌ'
                              : 'اِضْغَطْ لِإِعَادَةِ هَذِهِ الكَلِمَةِ'
                          }
                        >
                          <span className="tracking-normal drop-shadow-xs">{tile.text}</span>
                          {answeredState !== 'correct' && (
                            <span className="opacity-0 group-hover:opacity-100 text-rose-500 text-xs font-bold mr-1 transition-opacity">
                              ✕
                            </span>
                          )}
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            ) : placedTiles.length === 0 ? (
              /* Level 1: Empty slots waiting for syllables */
              <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 w-full py-2">
                {currentQ.parts.map((_, i) => (
                  <div
                    key={i}
                    className="w-16 sm:w-20 h-14 sm:h-16 rounded-2xl border-2 border-dashed border-amber-300 bg-white/60 flex flex-col items-center justify-center text-amber-500 font-black text-xs sm:text-sm shadow-xs"
                  >
                    <span className="text-[10px] text-amber-400 font-bold">مَقْطَع</span>
                    <span className="text-sm sm:text-base font-black">{i + 1}</span>
                  </div>
                ))}
              </div>
            ) : placedTiles.length < currentQ.parts.length ? (
              /* Level 1: Syllables being arranged in separate cards with remaining slots */
              <div className="flex items-center justify-center flex-wrap gap-2.5 sm:gap-3.5 w-full py-1">
                <AnimatePresence>
                  {placedTiles.map((tile, idx) => (
                    <motion.div
                      key={tile.id}
                      initial={{ scale: 0.6, y: -10, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                      onClick={() => handleReturnTile(idx)}
                      className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-white border-2 border-amber-400 border-b-4 border-b-amber-600 text-slate-900 font-black text-3xl sm:text-4xl shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform leading-snug tracking-normal relative group select-none"
                      title="اِضْغَطْ لِإِعَادَةِ هَذِهِ البِطَاقَةِ"
                    >
                      {tile.text}
                      {answeredState !== 'correct' && (
                        <span className="absolute -top-2 -left-2 w-5 h-5 bg-rose-500 text-white rounded-full text-xs flex items-center justify-center opacity-80 group-hover:opacity-100 shadow-xs">
                          ×
                        </span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {/* Remaining empty slots */}
                {Array.from({ length: currentQ.parts.length - placedTiles.length }).map((_, emptyIdx) => {
                  const slotNumber = placedTiles.length + emptyIdx + 1;
                  return (
                    <div
                      key={`empty-slot-${slotNumber}`}
                      className="w-16 sm:w-20 h-14 sm:h-16 rounded-2xl border-2 border-dashed border-amber-300/70 bg-amber-50/50 flex flex-col items-center justify-center text-amber-400 font-bold text-xs sm:text-sm"
                    >
                      <span className="text-[10px] text-amber-300 font-bold">مَقْطَع</span>
                      <span className="text-sm font-black">{slotNumber}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── Level 1: ALL SYLLABLES PLACED: THEY STICK AND CONNECT TOGETHER TO FORM THE CONNECTED WORD ── */
              <motion.div
                initial={{ scale: 0.88, y: -4 }}
                animate={{ scale: [0.94, 1.05, 1], y: 0 }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                className="w-full flex flex-col items-center justify-center py-1"
              >
                {/* Connected Unified Word Banner: gap-0 so syllables stick and touch */}
                <div
                  className={`inline-flex items-center justify-center dir-rtl gap-0 py-3 sm:py-4 px-6 sm:px-10 rounded-3xl bg-white shadow-xl border-3 transition-all ${
                    answeredState === 'correct'
                      ? 'border-emerald-500 shadow-emerald-500/25 bg-gradient-to-b from-white to-emerald-50/70'
                      : answeredState === 'wrong'
                      ? 'border-rose-400 shadow-rose-500/15 bg-gradient-to-b from-white to-rose-50/70'
                      : 'border-amber-400 shadow-amber-500/20 bg-gradient-to-b from-white to-amber-50/70'
                  }`}
                >
                  {placedTiles.map((tile, idx) => (
                    <span
                      key={tile.id}
                      onClick={() => handleReturnTile(idx)}
                      className={`font-black text-4xl sm:text-5xl md:text-6xl inline p-0 m-0 leading-none tracking-normal select-none transition-colors cursor-pointer ${
                        answeredState === 'correct'
                          ? 'text-emerald-700'
                          : answeredState === 'wrong'
                          ? 'text-rose-700'
                          : 'text-slate-900 hover:text-amber-700'
                      }`}
                      title={
                        answeredState === 'correct'
                          ? 'كَلِمَةٌ مُتَّصِلَةٌ مُكْتَمِلَةٌ'
                          : 'اِضْغَطْ لِإِعَادَةِ هَذَا المَقْطَعِ'
                      }
                    >
                      {tile.text}
                    </span>
                  ))}
                </div>

                {/* Clear status badge */}
                <div className="mt-2.5">
                  {answeredState === 'correct' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-full shadow-xs animate-bounce-slow">
                      <span>✨</span>
                      <span>تَشَكَّلَتِ الكَلِمَةُ مُتَّصِلَةً بِنَجَاحٍ!</span>
                    </span>
                  ) : answeredState === 'wrong' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-rose-800 bg-rose-100 px-3.5 py-1 rounded-full shadow-xs">
                      <span>⚠️</span>
                      <span>تَرْتِيبُ المَقَاطِعِ غَيْرُ صَحِيحٍ، اِضْغَطْ عَلَى مَقْطَعٍ لِتَعْدِيلِهِ</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-amber-800 bg-amber-100 px-3.5 py-1 rounded-full shadow-xs">
                      <span>🔗</span>
                      <span>اتَّصَلَتِ المَقَاطِعُ! اضْغَطْ «تَحَقَّقْ» لِلتَّأْكِيدِ</span>
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Guide hint */}
          <div className="text-xs sm:text-sm font-extrabold text-slate-500 mb-2">
            {level === 1
              ? '👆 اِضْغَطْ عَلَى المَقَاطِعِ بِالتَّرْتِيبِ، وَعِنْدَ وَضْعِ آخِرِ مَقْطَعٍ تَتَّصِلُ الكَلِمَةُ:'
              : level === 2
              ? '👆 اِضْغَطْ عَلَى الكَلِمَاتِ بِالتَّرْتِيبِ لِتَرْكِيبِ الجُمْلَةِ:'
              : '👆 اِضْغَطْ عَلَى الجُمَلِ بِالتَّرْتِيبِ الزَّمَنِيِّ لِتَكْوِينِ القِصَّةِ:'}
          </div>

          {/* ── AVAILABLE TILES POOL (Juicy 3D Learning Blocks / Sentence Strips) ── */}
          {level === 3 ? (
            <div className="w-full space-y-2.5 mb-3">
              {shuffledTiles.map((part, originalIdx) => {
                const isUsed = placedTiles.some((t) => t.originalIndex === originalIdx);
                const colorTheme = TILE_COLOR_SCHEMES[originalIdx % TILE_COLOR_SCHEMES.length];
                const isReading = activeReadingIndex === originalIdx;

                if (isUsed) return null;

                return (
                  <button
                    key={`${part}-${originalIdx}`}
                    disabled={answeredState === 'correct'}
                    onClick={() => handlePlaceTile(part, originalIdx)}
                    className={`w-full p-3.5 sm:p-4 rounded-2xl font-bold text-base sm:text-lg shadow-md border-2 border-b-4 transition-all text-right flex items-center gap-3 relative ${
                      isReading
                        ? 'animate-reading-sentence-blink z-30 ring-4 ring-teal-400 ring-offset-4 ring-offset-white border-teal-600 shadow-2xl shadow-teal-500/60 bg-gradient-to-r from-teal-100 via-emerald-100 to-teal-200 text-teal-950 font-black'
                        : `${colorTheme.bg} ${colorTheme.border} ${colorTheme.text} ${colorTheme.shadow} hover:scale-[1.01] active:translate-y-1 active:border-b-0`
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full border text-sm flex items-center justify-center shrink-0 font-black ${
                        isReading
                          ? 'bg-teal-600 text-white border-teal-700 animate-bounce'
                          : 'bg-white/90 border-slate-300'
                      }`}
                    >
                      {isReading ? '🔊' : '🔹'}
                    </span>
                    <span className="leading-relaxed flex-1">{part}</span>
                    {isReading && (
                      <span className="px-2.5 py-1 rounded-full bg-teal-600 text-white text-xs font-black shadow-md flex items-center gap-1.5 animate-bounce shrink-0">
                        <span>قِرَاءَةٌ...</span>
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : level === 2 ? (
            /* ── LEVEL 2: CANDIDATE WORDS ── */
            <div className="w-full flex items-center justify-center mb-3 min-h-[64px]">
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 w-full py-1.5 px-1">
                {shuffledTiles.map((part, originalIdx) => {
                  const isUsed = placedTiles.some((t) => t.originalIndex === originalIdx);
                  const colorTheme = TILE_COLOR_SCHEMES[originalIdx % TILE_COLOR_SCHEMES.length];
                  const isReading = activeReadingIndex === originalIdx;

                  return (
                    <button
                      key={`${part}-${originalIdx}`}
                      disabled={isUsed || answeredState === 'correct'}
                      onClick={() => handlePlaceTile(part, originalIdx)}
                      className={`px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-2xl font-black text-2xl sm:text-3xl shadow-md border-2 border-b-4 transition-all whitespace-nowrap leading-normal relative select-none ${
                        isUsed
                          ? 'opacity-0 pointer-events-none scale-50'
                          : isReading
                          ? 'animate-reading-tile-blink z-30 ring-4 ring-purple-500 ring-offset-4 ring-offset-white border-purple-600 shadow-2xl shadow-purple-500/70 bg-gradient-to-b from-purple-200 via-purple-100 to-purple-300 text-purple-950 font-black cursor-pointer'
                          : `${colorTheme.bg} ${colorTheme.border} ${colorTheme.text} ${colorTheme.shadow} hover:scale-105 active:translate-y-1 active:border-b-0 cursor-pointer`
                      }`}
                    >
                      {part}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 mb-3 min-h-[72px]">
              {shuffledTiles.map((part, originalIdx) => {
                const isUsed = placedTiles.some((t) => t.originalIndex === originalIdx);
                const colorTheme = TILE_COLOR_SCHEMES[originalIdx % TILE_COLOR_SCHEMES.length];
                const isReading = activeReadingIndex === originalIdx;

                return (
                  <button
                    key={`${part}-${originalIdx}`}
                    disabled={isUsed || answeredState === 'correct'}
                    onClick={() => handlePlaceTile(part, originalIdx)}
                    className={`px-5 py-3.5 sm:px-7 sm:py-4 rounded-3xl font-black text-3xl sm:text-4xl shadow-md border-2 border-b-4 transition-all leading-snug tracking-wider relative ${
                      isUsed
                        ? 'opacity-0 pointer-events-none scale-50'
                        : isReading
                        ? 'animate-reading-tile-blink z-30 ring-4 ring-amber-400 ring-offset-4 ring-offset-white border-amber-500 shadow-2xl shadow-amber-500/60 bg-gradient-to-b from-amber-200 via-amber-100 to-amber-300 text-amber-950 font-black cursor-pointer'
                        : `${colorTheme.bg} ${colorTheme.border} ${colorTheme.text} ${colorTheme.shadow} hover:scale-105 active:translate-y-1 active:border-b-0`
                    }`}
                  >
                    {isReading && (
                      <span className="absolute -top-3.5 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-black shadow-lg flex items-center gap-1 animate-bounce pointer-events-none z-40">
                        <span>🔊</span>
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      </span>
                    )}
                    {part}
                  </button>
                );
              })}
            </div>
          )}

          {/* Feedback Encouragement Banner */}
          {actionFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-2xl text-sm sm:text-base font-black mb-3 transition-all shadow-xs ${
                answeredState === 'correct'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : answeredState === 'wrong'
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : 'bg-purple-100 text-purple-900 border border-purple-200'
              }`}
            >
              {actionFeedback}
            </motion.div>
          )}

          {/* ── MAIN ACTIONS: Verify, Next, Clear, Voice ── */}
          <div className="space-y-2.5 mt-2">
            {answeredState === 'correct' ? (
              <button
                onClick={handleNext}
                className="w-full py-4 px-6 rounded-2xl font-black text-xl sm:text-2xl text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 border-b-4 border-emerald-700 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-3 animate-bounce-slow"
              >
                <span>السُّؤَالُ التَّالِي ⬅️</span>
                <ArrowLeft className="w-7 h-7" />
              </button>
            ) : (
              <button
                onClick={handleVerify}
                disabled={!allTilesPlaced}
                className={`w-full py-4 px-6 rounded-2xl font-black text-lg sm:text-xl transition-all flex items-center justify-center gap-2 ${
                  allTilesPlaced
                    ? level === 1
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:from-amber-600 hover:to-rose-600 shadow-lg shadow-rose-500/25 border-b-4 border-rose-700 active:translate-y-1 active:border-b-0'
                      : level === 2
                      ? 'bg-gradient-to-r from-purple-600 to-sky-500 text-white hover:from-purple-700 hover:to-sky-600 shadow-lg shadow-purple-500/25 border-b-4 border-purple-800 active:translate-y-1 active:border-b-0'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 border-b-4 border-emerald-800 active:translate-y-1 active:border-b-0'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border-b-4 border-slate-300'
                }`}
              >
                <CheckCircle className="w-6 h-6" />
                <span>تَحَقَّقْ مِنَ الإِجَابَةِ</span>
              </button>
            )}

            {/* Secondary Buttons Row */}
            <div className="flex gap-2.5">
              <button
                onClick={handleRetry}
                className="flex-1 py-3 px-3 rounded-2xl font-black text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 border-b-4 border-slate-300 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-slate-600" />
                <span>إِعَادَةُ التَّرْتِيبِ</span>
              </button>

              <button
                onClick={toggleListening}
                disabled={answeredState === 'correct'}
                className={`flex-1 py-3 px-3.5 rounded-2xl font-black text-sm border-b-4 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2 ${
                  isListening
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-700 animate-pulse shadow-lg shadow-rose-500/30'
                    : answeredState === 'correct'
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-sky-100 text-sky-900 hover:bg-sky-200 border-sky-300'
                }`}
                title="إِدْخَالُ الإِجَابَةِ الصَّحِيحَةِ صَوْتِيّاً خِلالَ عَدٍّ تَنَازُلِيٍّ 15 ثَانِيَة"
              >
                <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce text-white' : 'text-sky-700'}`} />
                <span>{isListening ? `نُطْقٌ ذَكِيٌّ (${countdown}ث)` : 'نُطْقٌ ذَكِيٌّ'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER BAR ── */}
      <footer className="w-full max-w-xl mx-auto mt-2 text-center relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl py-2.5 px-4 border border-slate-200 shadow-xs flex items-center justify-center text-xs sm:text-sm font-black text-slate-700">
          <span>التعلم الممتع - تركيب كلمات وجمل وفقرات - سميرة عبد الصدوق</span>
        </div>
      </footer>

      {/* AI Real-time Pronunciation Feedback Sheet */}
      <AIPronunciationSheet
        feedback={aiFeedback}
        targetWord={currentQ?.word || ''}
        onClose={() => setAiFeedback(null)}
      />

      {/* Celebration Modal when level finishes */}
      {showCelebration && (
        <CelebrationModal
          score={score}
          total={currentQuestions.length}
          level={level}
          onRetry={() => {
            setShowCelebration(false);
            setQuestionIndex(0);
            setScore(0);
          }}
          onNextLevel={() => {
            const nextLvl = (level === 1 ? 2 : 3) as LevelId;
            unlockLevel(nextLvl);
            handleSwitchLevel(nextLvl);
          }}
          onBackToFirst={() => handleSwitchLevel(1)}
        />
      )}
    </motion.main>
  );
}
