import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { stopAllSpeech } from '../utils/soundEngine';

interface SplashScreenProps {
  isOpen: boolean;
  initialStage?: 'icon' | 'welcome';
  onClose: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isOpen,
  initialStage = 'icon',
  onClose,
}) => {
  const [stage, setStage] = useState<'icon' | 'welcome'>(initialStage);
  const [activeDot, setActiveDot] = useState(0);

  // Sync stage whenever opened with a specific initialStage
  useEffect(() => {
    if (isOpen) {
      setStage(initialStage);
      stopAllSpeech();
    }
  }, [isOpen, initialStage]);

  // Stage 1 (Icon Cover): Display full-screen icon for 2 seconds then transition to welcome screen
  useEffect(() => {
    if (!isOpen || stage !== 'icon') return;
    const timer = setTimeout(() => {
      setStage('welcome');
    }, 2000);
    return () => clearTimeout(timer);
  }, [isOpen, stage]);

  // Stage 2 (Welcome Screen): Auto-transition to main app after 5 seconds
  useEffect(() => {
    if (!isOpen || stage !== 'welcome') return;
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [isOpen, stage, onClose]);

  // Cycle the indicator dots to simulate active dynamic loading
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % 3);
    }, 600);
    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="splash-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 overflow-hidden select-none bg-[#011412] font-sans"
        >
          {/* ════════════════════════════════════════════════════════════════
              STAGE 1: COMPACT APP ICON (الشاشة الأولى: الاحتفاظ بالأيقونة الأصغر حجماً فقط وحذف الكبيرة)
             ════════════════════════════════════════════════════════════════ */}
          {stage === 'icon' ? (
            <motion.div
              key="stage-icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              onClick={() => setStage('welcome')}
              className="relative w-full h-full flex flex-col items-center justify-center cursor-pointer bg-[#011412] overflow-hidden"
              title="اِضْغَطْ لِلانْتِقَالِ لِلشَّاشَةِ التَّرْحِيبِيَّةِ"
            >
              {/* Ambient backdrop glow */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#003d37]/40 via-[#011412] to-[#011412]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#00C9B7]/15 blur-3xl" />
              </div>

              {/* Smaller App Icon (الصورة الأولى الأصغر حجماً فقط) */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative z-10 flex flex-col items-center"
              >
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[22px] p-[2px] bg-gradient-to-b from-white/70 via-[#00C9B7]/50 to-white/20 shadow-[0_16px_40px_rgba(0,201,183,0.35)] backdrop-blur-xl">
                  <div className="w-full h-full rounded-[20px] overflow-hidden bg-slate-900 border border-white/25 relative">
                    <img
                      src="/app-icon.jpg"
                      alt="أيقونة تركيب كلمات وجمل وفقرات"
                      className="w-full h-full object-cover"
                    />
                    {/* Sweeping Light Sheen */}
                    <motion.div
                      animate={{
                        x: ['-150%', '220%'],
                      }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        repeatDelay: 1,
                        ease: 'easeInOut',
                      }}
                      className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 pointer-events-none"
                    />
                  </div>
                </div>

                {/* Bottom Cue */}
                <div className="mt-8 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-teal-200/90 text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00C9B7] animate-ping" />
                  <span>جَارٍ الفَتْحُ...</span>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            /* ════════════════════════════════════════════════════════════════
               STAGE 2: REDESIGNED WELCOME SCREEN (الشاشة الترحيبية المستحدثة)
               - عنوان التطبيق: تَرْكِيبُ كَلِمَاتٍ وَجُمَلٍ وَفِقْرَاتٍ
               - العنوان الفرعي: تَعَلَّمِ القِرَاءَةَ وَالتَّرْكِيبَ بِمَرَحٍ
               - عبارة الشعار: ✨️ التعلم الممتع - رنيم فاي ✨️
               - مدة الظهور: 5 ثوانٍ ثم الانتقال تلقائياً للواجهة الرئيسية
               ════════════════════════════════════════════════════════════════ */
            <motion.div
              key="stage-welcome"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.03 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              onClick={onClose}
              className="relative w-full h-full flex flex-col items-center justify-between text-center px-4 py-8 sm:py-12 bg-[#021b18] cursor-pointer"
            >
              {/* ── FLUID AMBIENT GLOW & ENERGY WAVES IN BRAND TEAL (#00C9B7) ── */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#003d37] via-[#022421] to-[#011412]" />

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

                {/* Floating Bokeh Stars */}
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

                <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent rotate-45 pointer-events-none" />
              </div>

              {/* ── UPPER-MIDDLE AREA: 3D ANIMATED APP ICON WITH BRAND TEAL NEON GLOW ── */}
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
                      y: [0, -10, 0],
                      rotate: [-2, 2, -2],
                      scale: [1, 1.03, 1],
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

                      {/* Dynamic Light Sheen sweep */}
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

                    {/* Floating Sparkles around icon */}
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

                {/* ── 3. TYPOGRAPHY: APP TITLE & SUBTITLE ── */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.6 }}
                  className="space-y-3 px-2"
                >
                  {/* عنوان التطبيق */}
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)] leading-tight">
                    تَرْكِيبُ كَلِمَاتٍ وَجُمَلٍ وَفِقْرَاتٍ
                  </h1>

                  {/* العنوان الفرعي */}
                  <p className="text-sm sm:text-base font-bold text-[#00C9B7] drop-shadow-[0_0_12px_rgba(0,201,183,0.7)] leading-relaxed">
                    تَعَلَّمِ القِرَاءَةَ وَالتَّرْكِيبَ بِمَرَحٍ
                  </p>
                </motion.div>

                {/* ── 4. SLOGAN BADGE: ✨️ التعلم الممتع - رنيم فاي ✨️ ── */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="mt-7 px-6 py-3 rounded-full bg-gradient-to-r from-[#00C9B7]/20 via-teal-500/25 to-[#00C9B7]/20 backdrop-blur-xl border border-[#00C9B7]/40 shadow-[0_8px_25px_rgba(0,201,183,0.35)] flex items-center justify-center"
                >
                  <span className="text-sm sm:text-base font-black text-teal-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] tracking-wide">
                    ✨️ التعلم الممتع - رنيم فاي ✨️
                  </span>
                </motion.div>
              </div>

              {/* ── 5. BOTTOM AREA (المنطقة السفلية للشاشة الترحيبية بعد حذف التذييل) ── */}
              <div className="w-full flex flex-col items-center gap-3 z-10 max-w-sm mt-auto pb-4 px-2">
                {/* 3 Animated Indicator Dots */}
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
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
