import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Play, Volume2 } from 'lucide-react';
import { playSuccessChime, stopAllSpeech } from '../utils/soundEngine';

interface SplashScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isOpen, onClose }) => {
  const [activeDot, setActiveDot] = useState(0);

  // Stop any active speech immediately whenever splash screen is open
  useEffect(() => {
    if (isOpen) {
      stopAllSpeech();
    }
  }, [isOpen]);

  // Cycle the indicator dots to simulate active dynamic loading
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % 3);
    }, 900);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleStart = () => {
    stopAllSpeech();
    playSuccessChime();
    onClose();
  };

  const handleSkip = () => {
    stopAllSpeech();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-between text-center overflow-hidden select-none bg-slate-950 font-sans px-4 py-8 sm:py-12"
      >
        {/* ── 1. ADAPTIVE & FULL-SCREEN FLUID AMBIENT BACKGROUND ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Base dynamic gradient matching app & icon palette */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1e113a] via-[#160c2b] to-[#0c071a]" />

          {/* Fluid Glowing Ambient Blobs & Energy Waves */}
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              x: [-20, 25, -20],
              y: [-15, 20, -15],
              rotate: [0, 90, 180, 270, 360],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-purple-600/30 via-pink-500/25 to-rose-400/20 blur-3xl"
          />

          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              x: [30, -25, 30],
              y: [20, -25, 20],
            }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/3 -right-24 w-[32rem] h-[32rem] rounded-full bg-gradient-to-bl from-cyan-500/25 via-sky-600/20 to-indigo-700/25 blur-3xl"
          />

          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.55, 0.3],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-20 left-1/4 w-80 h-80 rounded-full bg-gradient-to-t from-amber-400/25 via-orange-500/20 to-transparent blur-3xl"
          />

          {/* Subtle light particles & floating sparks (bokeh) */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              style={{
                width: i % 3 === 0 ? '6px' : i % 2 === 0 ? '4px' : '3px',
                height: i % 3 === 0 ? '6px' : i % 2 === 0 ? '4px' : '3px',
                top: `${(i * 8.3 + 12) % 90}%`,
                left: `${(i * 15.7 + 8) % 92}%`,
                opacity: 0.25 + (i % 4) * 0.18,
              }}
              animate={{
                y: [0, -25, 0],
                opacity: [0.2, 0.8, 0.2],
                scale: [0.8, 1.3, 0.8],
              }}
              transition={{
                duration: 3.5 + (i % 5),
                repeat: Infinity,
                delay: (i * 0.4) % 3,
                ease: 'easeInOut',
              }}
            />
          ))}

          {/* Diagonal Glassmorphism light streak */}
          <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent rotate-45 pointer-events-none" />
        </div>

        {/* ── TOP SPACER / BRANDING TAG ── */}
        <div className="w-full flex justify-between items-center z-10 max-w-sm px-2">
          <span className="text-[11px] font-black tracking-wider text-purple-300/70 uppercase">
            تَطْبِيقٌ تَعْلِيمِيٌّ ذَكِيٌّ
          </span>
          <button
            onClick={handleSkip}
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md cursor-pointer"
          >
            تَخَطِّي
          </button>
        </div>

        {/* ── 2. UPPER-MIDDLE AREA: 3D ANIMATED APP ICON WITH HARMONIZED NEON GLOW ── */}
        <div className="flex flex-col items-center justify-center z-10 my-auto w-full max-w-sm">
          <motion.div
            initial={{ scale: 0.7, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            className="relative mb-6"
          >
            {/* Deep Centered Ambient Radial Halo - Harmonious single-phase breathing */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.4, 0.65, 0.4],
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-10 rounded-full bg-gradient-to-tr from-purple-600/40 via-pink-500/35 to-cyan-400/30 blur-2xl pointer-events-none"
            />

            {/* Harmonious Single Neon Glow Halo - Perfectly in sync without clash */}
            <motion.div
              animate={{
                scale: [1, 1.06, 1],
                opacity: [0.5, 0.75, 0.5],
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-3 rounded-[30px] bg-gradient-to-tr from-rose-500 via-purple-500 to-cyan-400 blur-xl opacity-60 pointer-events-none"
            />

            {/* High-Resolution Rounded-Square App Icon with 3D Floating & Shimmer Animation */}
            <motion.div
              animate={{
                y: [0, -12, 0],
                rotate: [-2, 2.5, -2],
                scale: [1, 1.04, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              whileHover={{ scale: 1.12, rotate: 0 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[20px] p-[3px] bg-gradient-to-b from-white/70 via-purple-300/40 to-white/10 shadow-[0_20px_50px_rgba(168,85,247,0.45)] backdrop-blur-xl cursor-pointer group select-none"
            >
              <div className="w-full h-full rounded-[17px] overflow-hidden bg-slate-900 border border-white/30 relative">
                <img
                  src="/app-icon.jpg"
                  alt="أيقونة تركيب كلمات وجمل وفقرات"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Dynamic Light Sheen / Glass Shimmer Reflection sweeping across the icon */}
                <motion.div
                  animate={{
                    x: ['-150%', '200%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 pointer-events-none"
                />
              </div>

              {/* Little Floating Stars around the animated icon */}
              <motion.span
                animate={{
                  scale: [0.8, 1.3, 0.8],
                  rotate: [0, 90, 180],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-2 -right-2 text-amber-300 text-base drop-shadow-[0_0_8px_rgba(252,211,77,0.8)] pointer-events-none"
              >
                ✨
              </motion.span>
              <motion.span
                animate={{
                  scale: [1.2, 0.7, 1.2],
                  rotate: [180, 90, 0],
                  opacity: [0.3, 0.9, 0.3],
                }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-1 -left-2 text-cyan-300 text-sm drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] pointer-events-none"
              >
                ⭐
              </motion.span>
            </motion.div>
          </motion.div>

          {/* ── 3. TYPOGRAPHY (CENTERED BELOW ICON) ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="space-y-3 px-2"
          >
            {/* Main Title: Big, bold Arabic text */}
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)] leading-tight">
              تَرْكِيبُ كَلِمَاتٍ وَجُمَلٍ وَفِقْرَاتٍ
            </h1>

            {/* Subtitle: Smaller, crisp Arabic text in glowing accent color */}
            <p className="text-sm sm:text-base font-bold text-pink-300 drop-shadow-[0_0_12px_rgba(244,114,182,0.6)] leading-relaxed">
              تَعَلَّمِ القِرَاءَةَ وَالتَّرْكِيبَ بِمَرَحٍ
            </p>
          </motion.div>

          {/* Interactive Start Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleStart}
            className="mt-8 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 text-white font-black text-base shadow-[0_10px_30px_rgba(236,72,153,0.45)] border border-white/30 flex items-center gap-2.5 group active:shadow-inner cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white text-white group-hover:scale-110 transition-transform" />
            <span>اِبْدَأِ التَّعَلُّمَ الآنَ</span>
          </motion.button>
        </div>

        {/* ── 4. BOTTOM AREA: BRANDING PILL & INDICATOR DOTS ── */}
        <div className="w-full flex flex-col items-center gap-4 z-10 max-w-sm mt-auto">
          {/* Glowing Frosted-Glass Branding Pill */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="px-5 py-2 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/20 shadow-[0_0_20px_rgba(168,85,247,0.25)] flex items-center gap-2 text-white"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.7)]" />
            <span className="text-xs sm:text-sm font-bold text-purple-100 tracking-wide">
              رنيم فاي | التّعلّم الممتِع
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.7)]" />
          </motion.div>

          {/* Three rounded navigation/loading dots with smooth glow effect */}
          <div className="flex items-center justify-center gap-2.5 pt-1">
            {[0, 1, 2].map((idx) => {
              const isActive = activeDot === idx;
              return (
                <motion.div
                  key={idx}
                  animate={{
                    scale: isActive ? 1.3 : 1,
                    opacity: isActive ? 1 : 0.4,
                  }}
                  transition={{ duration: 0.3 }}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]'
                      : 'bg-white/40 shadow-none'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
