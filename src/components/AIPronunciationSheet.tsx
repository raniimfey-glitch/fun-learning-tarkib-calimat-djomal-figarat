import React from 'react';
import { Sparkles, CheckCircle, AlertCircle, Volume2, X } from 'lucide-react';
import { AIPronunciationFeedback } from '../types';
import { speakArabic } from '../utils/soundEngine';

interface AIPronunciationSheetProps {
  feedback: AIPronunciationFeedback | null;
  targetWord: string;
  onClose: () => void;
}

export const AIPronunciationSheet: React.FC<AIPronunciationSheetProps> = ({
  feedback,
  targetWord,
  onClose,
}) => {
  if (!feedback) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-100 border-emerald-300';
    if (score >= 60) return 'text-amber-800 bg-amber-100 border-amber-300';
    return 'text-rose-800 bg-rose-100 border-rose-300';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] p-6 sm:p-7 max-w-md w-full shadow-2xl border-2 border-purple-200 relative animate-in zoom-in-95 duration-200 text-right">
        {/* Close Button / Tap to dismiss */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100"
          aria-label="إغلاق"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-4 text-purple-900 font-black text-xl sm:text-2xl">
          <Sparkles className="w-7 h-7 text-amber-500 animate-pulse" />
          <span>تَحْلِيلُ النُّطْقِ الذَّكِيِّ</span>
        </div>

        {/* Score & Accuracy Badge */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 mb-4">
          <div>
            <div className="text-sm text-slate-600 font-black mb-1">تَقْيِيمُ النُّطْقِ</div>
            <div className="text-2xl sm:text-3xl font-black text-purple-900">{feedback.accuracy}</div>
          </div>
          <div
            className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 font-black ${getScoreColor(
              feedback.score
            )}`}
          >
            <span className="text-2xl leading-none">{feedback.score}</span>
            <span className="text-xs font-bold opacity-80">/ 100</span>
          </div>
        </div>

        {/* Target vs Spoken */}
        <div className="space-y-3 mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center text-base sm:text-lg">
            <span className="text-slate-600 font-bold">الكَلِمَةُ المَطْلُوبَةُ:</span>
            <span
              onClick={() => speakArabic(targetWord)}
              className="font-black text-slate-900 text-2xl sm:text-3xl cursor-pointer hover:text-purple-600 flex items-center gap-2"
            >
              {targetWord} <Volume2 className="w-6 h-6 text-purple-600" />
            </span>
          </div>
          <div className="flex justify-between items-center text-base sm:text-lg">
            <span className="text-slate-600 font-bold">مَا تَمَّ سَمَاعُهُ:</span>
            <span className="font-black text-purple-800 text-xl sm:text-2xl">{feedback.detectedWord}</span>
          </div>
        </div>

        {/* Syllable Breakdown */}
        {feedback.phoneticBreakdown && feedback.phoneticBreakdown.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-black text-slate-700 mb-2">تَحْلِيلُ المَقَاطِعِ الصَّوْتِيَّةِ:</div>
            <div className="grid grid-cols-2 gap-2.5">
              {feedback.phoneticBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl text-sm flex items-center justify-between border-2 ${
                    item.status === 'correct'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}
                >
                  <span className="font-black text-xl sm:text-2xl">{item.syllable}</span>
                  {item.status === 'correct' ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback description & encouragement */}
        <div className="text-sm sm:text-base text-slate-700 bg-purple-50 p-4 rounded-2xl border border-purple-200 mb-4 leading-relaxed">
          <p className="font-black text-purple-950 mb-1">{feedback.feedback}</p>
          <p className="text-slate-600 font-bold">{feedback.encouragement}</p>
        </div>

        {/* Quick Dismiss Button */}
        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-base shadow-md active:scale-95 transition"
        >
          مُوَاصَلَةُ التَّعَلُّمِ ✨
        </button>
      </div>
    </div>
  );
};
