import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { stopAllSpeech } from '../utils/soundEngine';

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

  // Auto-dismiss splash screen after exactly 3 seconds (3000ms) and enter app directly
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  // Cycle the indicator dots to simulate active dynamic loading
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % 3);
    }, 750);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-between text-center overflow-hidden select-none bg-[#021b18] font-sans px-4 py-8 sm:py-12"
      >
        {/* ── 1. ADAPTIVE & FULL-SCREEN FLUID AMBIENT BACKGROUND ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Base dynamic gradient in brand teal palette (#00C9B7) */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#003d37] via-[#022421] to-[#011412]" />

          {/* Fluid Glowing Ambient Blobs & Energy Waves in Brand Teal */}
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              x: [-20, 25, -20],
              y: [-15, 20, -15],
              rotate: [0, 90, 180, 270, 360],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-[#00C9B7]/35 via-teal-400/25 to-emerald-400/20 blur-3xl"
          />

          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              x: [30, -25, 30],
              y: [20, -25, 20],
            }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/3 -right-24 w-[32rem] h-[32rem] rounded-full bg-gradient-to-bl from-[#00C9B7]/30 via-teal-500/25 to-cyan-500/20 blur-3xl"
          />

          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-20 left-1/4 w-80 h-80 rounded-full bg-gradient-to-t from-[#00C9B7]/30 via-teal-400/20 to-transparent blur-3xl"
          />

          {/* Subtle light particles & floating sparks (bokeh) with teal glow */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white shadow-[0_0_10px_#00C9B7]"
              style={{
                width: i % 3 === 0 ? '6px' : i % 2 === 0 ? '4px' : '3px',
                height: i % 3 === 0 ? '6px' : i % 2 === 0 ? '4px' : '3px',
                top: `${(i * 8.3 + 12) % 90}%`,
                left: `${(i * 15.7 + 8) % 92}%`,
                opacity: 0.25 + (i % 4) * 0.18,
              }}
              animate={{
                y: [0, -25, 0],
                opacity: [0.2, 0.85, 0.2],
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

        {/* ── TOP SPACER (Clean spacing without buttons/tags) ── */}
        <div className="w-full h-4 z-10 max-w-sm" />

        {/* ── 2. UPPER-MIDDLE AREA: 3D ANIMATED APP ICON WITH BRAND TEAL NEON GLOW ── */}
        <div className="flex flex-col items-center justify-center z-10 my-auto w-full max-w-sm">
          <motion.div
            initial={{ scale: 0.7, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            className="relative mb-6"
          >
            {/* Deep Centered Ambient Radial Halo in Brand Teal */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.45, 0.7, 0.45],
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-10 rounded-full bg-gradient-to-tr from-[#00C9B7]/45 via-teal-400/35 to-emerald-400/30 blur-2xl pointer-events-none"
            />

            {/* Harmonious Single Neon Glow Halo in Brand Teal */}
            <motion.div
              animate={{
                scale: [1, 1.06, 1],
                opacity: [0.55, 0.8, 0.55],
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-3 rounded-[30px] bg-gradient-to-tr from-[#00C9B7] via-teal-400 to-cyan-300 blur-xl opacity-65 pointer-events-none"
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
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[20px] p-[3px] bg-gradient-to-b from-white/80 via-[#00C9B7]/50 to-white/20 shadow-[0_20px_50px_rgba(0,201,183,0.45)] backdrop-blur-xl select-none"
            >
              <div className="w-full h-full rounded-[17px] overflow-hidden bg-slate-900 border border-white/30 relative">
                <img
                  src="/app-icon.jpg"
                  alt="أيقونة تركيب كلمات وجمل وفقرات"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
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

              {/* Little Floating Stars around the animated icon with brand teal glow */}
              <motion.span
                animate={{
                  scale: [0.8, 1.3, 0.8],
                  rotate: [0, 90, 180],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-2 -right-2 text-[#00C9B7] text-base drop-shadow-[0_0_10px_rgba(0,201,183,0.9)] pointer-events-none"
              >
                ✨
              </motion.span>
              <motion.span
                animate={{
                  scale: [1.2, 0.7, 1.2],
                  rotate: [180, 90, 0],
                  opacity: [0.4, 0.95, 0.4],
                }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-1 -left-2 text-teal-200 text-sm drop-shadow-[0_0_8px_rgba(0,201,183,0.8)] pointer-events-none"
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

            {/* Subtitle: Smaller, crisp Arabic text in glowing brand teal */}
            <p className="text-sm sm:text-base font-bold text-[#00C9B7] drop-shadow-[0_0_12px_rgba(0,201,183,0.7)] leading-relaxed">
              تَعَلَّمِ القِرَاءَةَ وَالتَّرْكِيبَ بِمَرَحٍ
            </p>
          </motion.div>

          {/* ── REPLACEMENT BADGE: ✨️ التعلم الممتع - رنيم فاي ✨️ ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-8 px-6 py-3 rounded-full bg-gradient-to-r from-[#00C9B7]/20 via-teal-500/25 to-[#00C9B7]/20 backdrop-blur-xl border border-[#00C9B7]/40 shadow-[0_8px_25px_rgba(0,201,183,0.35)] flex items-center justify-center"
          >
            <span className="text-sm sm:text-base font-black text-teal-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] tracking-wide">
              ✨️ التعلم الممتع - رنيم فاي ✨️
            </span>
          </motion.div>
        </div>

        {/* ── 4. BOTTOM AREA: 3 INDICATOR DOTS IN BRAND TEAL ── */}
        <div className="w-full flex flex-col items-center gap-3 z-10 max-w-sm mt-auto">
          {/* Three rounded loading dots with smooth brand teal glow effect */}
          <div className="flex items-center justify-center gap-2.5 pt-1">
            {[0, 1, 2].map((idx) => {
              const isActive = activeDot === idx;
              return (
                <motion.div
                  key={idx}
                  animate={{
                    scale: isActive ? 1.35 : 1,
                    opacity: isActive ? 1 : 0.35,
                  }}
                  transition={{ duration: 0.25 }}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-[#00C9B7] shadow-[0_0_14px_#00C9B7]'
                      : 'bg-white/35 shadow-none'
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
