import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, X, Volume2 } from 'lucide-react';
import { LevelId } from '../types';

interface VoiceCountdownIndicatorProps {
  isListening: boolean;
  countdown: number;
  liveTranscript: string;
  level: LevelId;
  targetHint?: string;
  onCancel: () => void;
}

export const VoiceCountdownIndicator: React.FC<VoiceCountdownIndicatorProps> = ({
  isListening,
  countdown,
  liveTranscript,
  level,
  targetHint,
  onCancel,
}) => {
  if (!isListening) return null;

  const totalSeconds = 15;
  const progressRatio = Math.max(0, Math.min(1, countdown / totalSeconds));
  const isUrgent = countdown <= 5;

  const levelPrompt =
    level === 1
      ? 'انْطِقِ الكَلِمَةَ بِصَوْتِكَ الآنَ'
      : level === 2
      ? 'انْطِقِ الجُمْلَةَ كَامِلَةً بِصَوْتِكَ'
      : 'اقْرَأْ جُمَلَ أَوْ فِقْرَةَ القِصَّةِ بِصَوْتِكَ';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        className="w-full mb-3 rounded-3xl overflow-hidden shadow-xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 via-white to-pink-50 text-slate-900 relative z-20"
      >
        {/* Animated Countdown Progress Bar Header */}
        <div className="w-full h-2.5 bg-rose-100 overflow-hidden relative">
          <motion.div
            className={`h-full transition-all duration-1000 ease-linear ${
              isUrgent
                ? 'bg-gradient-to-r from-red-500 to-rose-600'
                : 'bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600'
            }`}
            style={{ width: `${progressRatio * 100}%` }}
          />
        </div>

        <div className="p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            {/* Pulsing Mic Badge with Circular Timer */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <span
                  className={`absolute -inset-1.5 rounded-full animate-ping opacity-60 ${
                    isUrgent ? 'bg-red-400' : 'bg-rose-400'
                  }`}
                />
                <div
                  className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md font-black text-lg ${
                    isUrgent
                      ? 'bg-gradient-to-tr from-red-600 to-rose-500 shadow-red-500/30'
                      : 'bg-gradient-to-tr from-rose-500 to-pink-500 shadow-rose-500/30'
                  }`}
                >
                  <Mic className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm sm:text-base text-rose-950">
                    {levelPrompt}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                      isUrgent
                        ? 'bg-red-600 text-white animate-bounce'
                        : 'bg-rose-200 text-rose-800'
                    }`}
                  >
                    ⏱️ {countdown} ثَانِيَة
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-bold mt-0.5">
                  تَكَلَّمْ بِوُضُوحٍ لِيَتِمَّ إِدْخَالُ الإِجَابَةِ الصَّحِيحَةِ تِلْقَائِيّاً!
                </p>
              </div>
            </div>

            {/* Cancel Button */}
            <button
              onClick={onCancel}
              className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs transition-colors flex items-center gap-1 shrink-0"
              title="إِلْغَاءُ النُّطْقِ الصَّوْتِيِّ"
            >
              <X className="w-3.5 h-3.5" />
              <span>إِلْغَاء</span>
            </button>
          </div>

          {/* Live speech feedback if child speaks */}
          {liveTranscript && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2.5 p-2.5 rounded-2xl bg-white/90 border border-rose-200 text-right shadow-2xs flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="text-xs text-slate-500 font-bold shrink-0">الصَّوْتُ المَسْمُوع:</span>
              <span className="text-xs sm:text-sm font-black text-rose-900 truncate">
                « {liveTranscript} »
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
