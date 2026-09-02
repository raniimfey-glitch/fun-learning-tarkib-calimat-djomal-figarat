import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  Mic,
  Star,
  ArrowLeft,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LevelId, Question, PlacedTile, AIPronunciationFeedback } from './types';
import { LEVEL_CONFIGS, INITIAL_DATA } from './data/learningData';
import {
  speakArabic,
  speakSyllablesSequential,
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
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // AI Pronunciation State
  const [aiFeedback, setAiFeedback] = useState<AIPronunciationFeedback | null>(null);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);

  const currentQuestions = questionsData[level] || INITIAL_DATA[1];
  const currentQ = currentQuestions[questionIndex] || currentQuestions[0];
  const levelConfig = LEVEL_CONFIGS[level];

  // Initialize and shuffle question
  const initQuestion = useCallback((q: Question) => {
    setPlacedTiles([]);
    setAnsweredState('idle');
    setAiFeedback(null);
    setActionFeedback(null);
    const shuffled = [...q.parts].sort(() => Math.random() - 0.5);
    setShuffledTiles(shuffled);

    // Pronounce the scrambled parts as displayed (not the connected word)
    setIsPlayingAudio(true);
    speakSyllablesSequential(shuffled, () => {
      setIsPlayingAudio(false);
    });
  }, []);

  useEffect(() => {
    if (currentQ) {
      initQuestion(currentQ);
    }
  }, [level, questionIndex, currentQ, initQuestion]);

  // Audio Pronunciation Trigger
  const handlePlaySound = useCallback(() => {
    if (!currentQ) return;
    setIsPlayingAudio(true);

    if (answeredState === 'correct') {
      setActionFeedback('🔊 اِسْتَمِعْ لِلنُّطْقِ الصَّحِيحِ');
      speakArabic(currentQ.word, {
        rate: level === 3 ? 0.9 : 0.82,
        onEnd: () => {
          setIsPlayingAudio(false);
          setTimeout(() => setActionFeedback(null), 1500);
        },
      });
    } else {
      setActionFeedback(
        level === 1
          ? '🔊 اِسْتَمِعْ لِلْمَقَاطِعِ المُشَوَّشَةِ'
          : level === 2
          ? '🔊 اِسْتَمِعْ لِلْكَلِمَاتِ المُشَوَّشَةِ'
          : '🔊 اِسْتَمِعْ لِلْجُمَلِ المُشَوَّشَةِ'
      );
      speakSyllablesSequential(shuffledTiles, () => {
        setIsPlayingAudio(false);
        setTimeout(() => setActionFeedback(null), 1500);
      });
    }
  }, [currentQ, answeredState, level, shuffledTiles]);

  // Verify Answer with Confetti & Sounds
  const handleVerify = useCallback(() => {
    if (!currentQ || answeredState !== 'idle') return;

    const userText = placedTiles.map((t) => t.text).join('|');
    const correctText = currentQ.parts.join('|');
    const isCorrect = userText === correctText;

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
    if (questionIndex + 1 < currentQuestions.length) {
      setQuestionIndex((prev) => prev + 1);
      setActionFeedback('السُّؤَالُ التَّالِي');
    } else {
      setShowCelebration(true);
    }
  }, [questionIndex, currentQuestions.length]);

  // Previous Question
  const handlePrevious = useCallback(() => {
    if (questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
      setActionFeedback('السُّؤَالُ السَّابِقُ');
    }
  }, [questionIndex]);

  // Clear / Retry
  const handleRetry = useCallback(() => {
    setPlacedTiles([]);
    setAnsweredState('idle');
    playTileSnapSound();
    setActionFeedback('أَعِدِ التَّرْتِيبَ');
  }, []);

  // Switch Level
  const handleSwitchLevel = useCallback((newLevel: LevelId) => {
    setLevel(newLevel);
    setQuestionIndex(0);
    setScore(0);
    setShowCelebration(false);
  }, []);

  // Tile Placement
  const handlePlaceTile = useCallback(
    (tileText: string, originalIndex: number) => {
      if (answeredState === 'correct') return;

      const isAlreadyPlaced = placedTiles.some((t) => t.originalIndex === originalIndex);
      if (isAlreadyPlaced) return;

      playTileSnapSound();
      speakArabic(tileText.replace(/[ـ\-]/g, ''));
      setPlacedTiles((prev) => [
        ...prev,
        { id: `tile-${Date.now()}-${originalIndex}`, text: tileText, originalIndex },
      ]);
    },
    [answeredState, placedTiles]
  );

  // Return Placed Tile back to pool
  const handleReturnTile = useCallback(
    (placedIndex: number) => {
      if (answeredState === 'correct') return;
      playTileSnapSound();
      setPlacedTiles((prev) => prev.filter((_, idx) => idx !== placedIndex));
    },
    [answeredState]
  );

  // Smart Voice Input Correct Answer Handler (Words, Sentences, and Story Paragraphs)
  const handleVoiceCorrectAnswer = useCallback(
    (matchedIndices?: number[]) => {
      if (!currentQ || answeredState === 'correct') return;

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

  return (
    <main
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
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shadow-md shadow-orange-500/20 border-2 border-white animate-bounce-slow shrink-0 bg-amber-100">
              <img
                src="/app-icon.jpg"
                alt="أيقونة تركيب كلمات وجمل وفقرات"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
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

          {/* Golden Stars Pill */}
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
        </div>

        {/* 3 Levels Switcher Tabs with 3D Toy Button effect */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          <button
            onClick={() => handleSwitchLevel(1)}
            className={`py-2.5 sm:py-3 px-2 rounded-2xl font-black text-sm sm:text-base transition-all shadow-md flex flex-col items-center justify-center border-b-4 active:translate-y-1 active:border-b-0 ${
              level === 1
                ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white border-rose-700 shadow-orange-500/25'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg">🧩</span>
              <span>المُسْتَوَى ١</span>
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
            className={`py-2.5 sm:py-3 px-2 rounded-2xl font-black text-sm sm:text-base transition-all shadow-md flex flex-col items-center justify-center border-b-4 active:translate-y-1 active:border-b-0 ${
              level === 2
                ? 'bg-gradient-to-br from-purple-500 via-indigo-600 to-sky-600 text-white border-indigo-800 shadow-indigo-500/25'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg">📚</span>
              <span>المُسْتَوَى ٢</span>
            </div>
            <span
              className={`text-[11px] sm:text-xs font-extrabold mt-0.5 whitespace-nowrap ${
                level === 2 ? 'text-sky-100' : 'text-slate-500'
              }`}
            >
              كَلِمَاتٌ ← جُمْلَةٌ
            </span>
          </button>

          <button
            onClick={() => handleSwitchLevel(3)}
            className={`py-2.5 sm:py-3 px-2 rounded-2xl font-black text-sm sm:text-base transition-all shadow-md flex flex-col items-center justify-center border-b-4 active:translate-y-1 active:border-b-0 ${
              level === 3
                ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-white border-teal-800 shadow-teal-500/25'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg">📖</span>
              <span>المُسْتَوَى ٣</span>
            </div>
            <span
              className={`text-[11px] sm:text-xs font-extrabold mt-0.5 whitespace-nowrap ${
                level === 3 ? 'text-teal-100' : 'text-slate-500'
              }`}
            >
              جُمَلٌ ← قِصَّةٌ
            </span>
          </button>
        </div>
      </header>

      {/* ── MAIN QUESTION CARD: Tactile Board ── */}
      <section className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center my-1 sm:my-2 relative z-10">
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

            {/* Sound Action Button */}
            <div className="flex items-center justify-center mt-3">
              <button
                onClick={handlePlaySound}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-amber-950 font-black text-base sm:text-lg shadow-md border-b-4 border-amber-600 active:translate-y-1 active:border-b-0 transition-all"
              >
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>
                  {answeredState === 'correct'
                    ? level === 3
                      ? '🔊 اِسْتَمِعْ لِلْقِصَّةِ'
                      : level === 2
                      ? '🔊 اِسْتَمِعْ لِلْجُمْلَةِ'
                      : '🔊 اِسْتَمِعْ لِلْكَلِمَةِ'
                    : level === 1
                    ? '🔊 اِسْتَمِعْ لِلْمَقَاطِعِ'
                    : level === 2
                    ? '🔊 اِسْتَمِعْ لِلْكَلِمَاتِ'
                    : '🔊 اِسْتَمِعْ لِلْجُمَلِ'}
                </span>
              </button>
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
            className={`min-h-[92px] sm:min-h-[105px] rounded-3xl border-2 border-dashed p-3 sm:p-4 my-3 flex items-center justify-center flex-wrap gap-2.5 sm:gap-3 transition-all ${
              answeredState === 'correct'
                ? 'border-emerald-400 bg-emerald-50/90 shadow-md shadow-emerald-500/10'
                : answeredState === 'wrong'
                ? 'border-rose-300 bg-rose-50/90'
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
            ) : placedTiles.length === 0 ? (
              <div className="flex items-center justify-center gap-3 w-full py-2">
                {currentQ.parts.map((_, i) => (
                  <div
                    key={i}
                    className="w-16 sm:w-20 h-14 sm:h-16 rounded-2xl border-2 border-dashed border-amber-300 bg-white/60 flex items-center justify-center text-slate-300 font-black text-sm"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            ) : (
              <AnimatePresence>
                {placedTiles.map((tile, idx) => (
                  <motion.div
                    key={tile.id}
                    initial={{ scale: 0.6, y: -10, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                    onClick={() => handleReturnTile(idx)}
                    className="px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl bg-white border-2 border-purple-400 border-b-4 border-b-purple-600 text-slate-900 font-black text-3xl sm:text-4xl shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform leading-snug tracking-wider relative group"
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
            )}
          </div>

          {/* Guide hint */}
          <div className="text-xs sm:text-sm font-extrabold text-slate-500 mb-2">
            {level === 3
              ? '👆 اِضْغَطْ عَلَى الجُمَلِ بِالتَّرْتِيبِ الزَّمَنِيِّ لِتَكْوِينِ القِصَّةِ:'
              : '👆 اِضْغَطْ عَلَى البِطَاقَاتِ بِالتَّرْتِيبِ لِوَضْعِهَا فِي المَكَانِ الصَّحِيحِ:'}
          </div>

          {/* ── AVAILABLE TILES POOL (Juicy 3D Learning Blocks / Sentence Strips) ── */}
          {level === 3 ? (
            <div className="w-full space-y-2.5 mb-3">
              {shuffledTiles.map((part, originalIdx) => {
                const isUsed = placedTiles.some((t) => t.originalIndex === originalIdx);
                const colorTheme = TILE_COLOR_SCHEMES[originalIdx % TILE_COLOR_SCHEMES.length];

                if (isUsed) return null;

                return (
                  <button
                    key={`${part}-${originalIdx}`}
                    disabled={answeredState === 'correct'}
                    onClick={() => handlePlaceTile(part, originalIdx)}
                    className={`w-full p-3.5 sm:p-4 rounded-2xl font-bold text-base sm:text-lg shadow-md border-2 border-b-4 transition-all text-right flex items-center gap-3 ${colorTheme.bg} ${colorTheme.border} ${colorTheme.text} ${colorTheme.shadow} hover:scale-[1.01] active:translate-y-1 active:border-b-0`}
                  >
                    <span className="w-7 h-7 rounded-full bg-white/90 border border-slate-300 text-sm flex items-center justify-center shrink-0 font-black">
                      🔹
                    </span>
                    <span className="leading-relaxed flex-1">{part}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 mb-3 min-h-[72px]">
              {shuffledTiles.map((part, originalIdx) => {
                const isUsed = placedTiles.some((t) => t.originalIndex === originalIdx);
                const colorTheme = TILE_COLOR_SCHEMES[originalIdx % TILE_COLOR_SCHEMES.length];

                return (
                  <button
                    key={`${part}-${originalIdx}`}
                    disabled={isUsed || answeredState === 'correct'}
                    onClick={() => handlePlaceTile(part, originalIdx)}
                    className={`px-5 py-3.5 sm:px-7 sm:py-4 rounded-3xl font-black text-3xl sm:text-4xl shadow-md border-2 border-b-4 transition-all leading-snug tracking-wider ${
                      isUsed
                        ? 'opacity-0 pointer-events-none scale-50'
                        : `${colorTheme.bg} ${colorTheme.border} ${colorTheme.text} ${colorTheme.shadow} hover:scale-105 active:translate-y-1 active:border-b-0`
                    }`}
                  >
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
          onNextLevel={() => handleSwitchLevel(level === 1 ? 2 : 3)}
          onBackToFirst={() => handleSwitchLevel(1)}
        />
      )}
    </main>
  );
}
