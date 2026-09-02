import React, { useEffect } from 'react';
import { RotateCcw, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSuccessChime } from '../utils/soundEngine';

interface CelebrationModalProps {
  score: number;
  total: number;
  level: number;
  onRetry: () => void;
  onNextLevel: () => void;
  onBackToFirst: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  score,
  total,
  level,
  onRetry,
  onNextLevel,
  onBackToFirst,
}) => {
  const percentage = total > 0 ? score / total : 0;

  useEffect(() => {
    if (percentage >= 0.5) {
      playSuccessChime();
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A06CD5', '#FF9F1C'],
        });
      } catch (e) {
        // ignore
      }
    }
  }, [percentage]);

  let emoji = '💪';
  let title = 'أَحْسَنْتَ المُحَاوَلَةَ!';
  let subtitle = 'المُمَارَسَةُ تَصْنَعُ الإِتْقَانَ! اِسْتَمِرَّ فِي التَّعَلُّمِ.';

  if (percentage === 1) {
    emoji = '🏆';
    title = 'مُذْهِلٌ! عَبْقَرِيُّ الكَلِمَاتِ!';
    subtitle = 'أَحْرَزْتَ العَلاَمَةَ الكَامِلَةَ وَجَمِيعَ النُّجُومِ الذَّهَبِيَّةِ! 🌟';
  } else if (percentage >= 0.7) {
    emoji = '🌟';
    title = 'أَدَاءٌ رَائِعٌ جِدّاً! أَحْسَنْتَ!';
    subtitle = 'أَتْقَنْتَ مُعْظَمَ الكَلِمَاتِ وَالمَقَاطِعِ بِنَجَاحٍ بَاهِرٍ!';
  } else if (percentage >= 0.5) {
    emoji = '👍';
    title = 'جَيِّدٌ جِدّاً! أَحْسَنْتَ!';
    subtitle = 'عَمَلٌ طَيِّبٌ، يُمْكِنُكَ الوُصُولُ لِلعَلاَمَةِ الكَامِلَةِ!';
  }

  const starsCount = percentage >= 0.9 ? 3 : percentage >= 0.6 ? 2 : percentage >= 0.3 ? 1 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] p-6 sm:p-8 max-w-md w-full shadow-2xl border-4 border-amber-300 text-center relative overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Top Rainbow Bar */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-rose-400 via-amber-400 via-emerald-400 to-sky-400" />

        {/* Emoji Trophy Stage */}
        <div className="relative inline-block my-2">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-100 to-yellow-200 flex items-center justify-center text-6xl shadow-inner border-2 border-amber-300 animate-bounce-slow">
            <span>{emoji}</span>
          </div>
          <Sparkles className="w-7 h-7 text-amber-500 absolute -top-1 -right-1 animate-sparkle-spin" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1.5">{title}</h2>
        <p className="text-base sm:text-lg font-bold text-slate-600 mb-5 leading-relaxed">{subtitle}</p>

        {/* Stars */}
        <div className="flex justify-center gap-3 mb-5">
          {[1, 2, 3].map((starIdx) => (
            <div
              key={starIdx}
              className={`text-4xl sm:text-5xl transition-transform duration-500 ${
                starIdx <= starsCount ? 'scale-110 text-amber-400 drop-shadow-md' : 'opacity-20 grayscale'
              }`}
            >
              ⭐
            </div>
          ))}
        </div>

        {/* Score Number Box */}
        <div className="bg-gradient-to-b from-amber-50 to-orange-50 rounded-3xl p-4 sm:p-5 border-2 border-amber-200 mb-6 shadow-inner">
          <div className="text-sm sm:text-base font-black text-amber-800 mb-1">مَجْمُوعُ النِّقَاطِ المُحَقَّقَةِ</div>
          <div className="text-5xl font-black text-amber-600">
            {score} <span className="text-2xl text-amber-400 font-bold">/ {total}</span>
          </div>
        </div>

        {/* Touch Action Buttons */}
        <div className="space-y-3">
          {level === 1 ? (
            <button
              onClick={onNextLevel}
              className="w-full py-4 px-5 rounded-2xl font-black text-lg sm:text-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md border-b-4 border-purple-800 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2"
            >
              <span>المُسْتَوَى الثَّانِي: تَرْكِيبُ الجُمَلِ 🚀</span>
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          ) : level === 2 ? (
            <button
              onClick={onNextLevel}
              className="w-full py-4 px-5 rounded-2xl font-black text-lg sm:text-xl text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md border-b-4 border-emerald-800 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2"
            >
              <span>المُسْتَوَى الثَّالِثُ: تَرْكِيبُ القِصَصِ 📖</span>
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          ) : (
            <button
              onClick={onBackToFirst}
              className="w-full py-4 px-5 rounded-2xl font-black text-lg sm:text-xl text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-md border-b-4 border-amber-800 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2"
            >
              <span>العَوْدَةُ لِلْمُسْتَوَى الأَوَّلِ 🌟</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          <button
            onClick={onRetry}
            className="w-full py-3.5 px-4 rounded-2xl font-black text-base sm:text-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border-b-4 border-slate-300 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5 text-slate-600" />
            <span>إِعَادَةُ التَّحَدِّي</span>
          </button>
        </div>
      </div>
    </div>
  );
};
