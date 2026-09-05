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

  // Stage 1 (Icon Cover): Display app icon for 5 seconds without any buttons or cues, then transition to welcome screen
  useEffect(() => {
    if (!isOpen || stage !== 'icon') return;
    const timer = setTimeout(() => {
      setStage('welcome');
    }, 5000);
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
              STAGE 1: COMPACT APP ICON COVER (شاشة الأيقونة الأولى لمدة 5 ثوانٍ بدون أزرار أو شاشات انتظار)
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
              {/* Static subtle dark background - calm and restful for the eyes */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#002622]/40 via-[#011412] to-[#011412]" />
              </div>

              {/* Centered App Icon - strictly no buttons, no extra pills */}
              <motion.div
                initial={{ scale: 0.92, opacity: 0.85 }}
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
                    {/* Subtle Sheen directly on icon */}
                    <motion.div
                      animate={{
                        x: ['-150%', '220%'],
                      }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        repeatDelay: 1.5,
                        ease: 'easeInOut',
                      }}
                      className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 pointer-events-none"
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            /* ════════════════════════════════════════════════════════════════
               STAGE 2: WELCOME SCREEN (الشاشة الترحيبية - البريق والشعاع مقتصر على الأيقونة فقط)
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
              className="relative w-full h-full flex flex-col items-center justify-between text-center px-4 py-8 sm:py-12 bg-[#011412] cursor-pointer overflow-hidden"
            >
              {/* Calm, soothing background without any moving flashing blobs or blinding flashes */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#00221e]/60 via-[#011412] to-[#011412]" />
              </div>

              {/* ── UPPER-MIDDLE AREA: APP ICON WITH GLOW & SHEEN STRICTLY ON THE ICON ── */}
              <div className="flex flex-col items-center justify-center z-10 my-auto w-full max-w-sm">
                <motion.div
                  initial={{ scale: 0.7, y: 30, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                  className="relative mb-6"
                >
                  {/* Subtle, soft ambient glow strictly localized behind the icon */}
                  <div className="absolute -inset-6 rounded-full bg-[#00C9B7]/25 blur-2xl pointer-events-none" />

                  {/* High-Resolution Rounded-Square App Icon with focused sheen */}
                  <motion.div
                    animate={{
                      y: [0, -6, 0],
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[20px] p-[2.5px] bg-gradient-to-b from-white/80 via-[#00C9B7]/50 to-white/20 shadow-[0_16px_38px_rgba(0,201,183,0.35)] backdrop-blur-xl select-none"
                  >
                    <div className="w-full h-full rounded-[17px] overflow-hidden bg-slate-900 border border-white/30 relative">
                      <img
                        src="/app-icon.jpg"
                        alt="أيقونة تركيب كلمات وجمل وفقرات"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />

                      {/* Sheen sweep on the icon itself */}
                      <motion.div
                        animate={{
                          x: ['-150%', '200%'],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          repeatDelay: 2,
                          ease: 'easeInOut',
                        }}
                        className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 pointer-events-none"
                      />
                    </div>

                    {/* Subtle sparkles localized right on the icon corners */}
                    <span className="absolute -top-1.5 -right-1.5 text-[#00C9B7] text-sm drop-shadow-[0_0_8px_rgba(0,201,183,0.8)] pointer-events-none">
                      ✨
                    </span>
                    <span className="absolute -bottom-1 -left-1.5 text-teal-200 text-xs drop-shadow-[0_0_6px_rgba(0,201,183,0.7)] pointer-events-none">
                      ✨
                    </span>
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
