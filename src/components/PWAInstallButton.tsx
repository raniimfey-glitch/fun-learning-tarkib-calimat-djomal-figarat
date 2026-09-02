import React, { useState } from 'react';
import { Download, Share, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  // Android / Desktop / Chrome installation prompt
  if (isInstallable) {
    return (
      <div className="w-full max-w-xl mx-auto mb-2.5 px-1 relative z-20">
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 text-white p-2.5 sm:p-3 rounded-2xl shadow-lg flex items-center justify-between gap-3 border border-white/20">
          <div className="flex items-center gap-2.5 text-right">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-lg">
              📲
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black leading-tight">
                تَثْبِيتُ التَّطْبِيقِ عَلَى الجِهَازِ
              </h4>
              <p className="text-[11px] text-sky-100 font-bold leading-tight">
                لِلتَّعَلُّمِ السَّرِيعِ وَبِدُونِ حَاجَةٍ لِلْمُتَصَفِّحِ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={install}
              className="py-1.5 px-3 rounded-xl bg-white text-indigo-950 font-black text-xs sm:text-sm shadow-md hover:bg-sky-50 active:scale-95 transition-all flex items-center gap-1.5 border-b-2 border-indigo-200"
            >
              <Download className="w-4 h-4 text-indigo-700" />
              <span>تَثْبِيت</span>
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="إِغْلَاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS Safari custom guidance
  if (isIOS) {
    return (
      <>
        <div className="w-full max-w-xl mx-auto mb-2.5 px-1 relative z-20">
          <div className="bg-white/95 backdrop-blur-md text-slate-800 p-2.5 sm:p-3 rounded-2xl shadow-md flex items-center justify-between gap-3 border border-purple-200">
            <div className="flex items-center gap-2.5 text-right">
              <span className="text-xl">🍏</span>
              <div>
                <h4 className="text-xs sm:text-sm font-black leading-tight text-slate-900">
                  تَثْبِيتُ التَّطْبِيقِ عَلَى الآيْفُون والآيْبَاد
                </h4>
                <p className="text-[11px] text-slate-500 font-bold">
                  إِضَافَةٌ مُبَاشَرَةٌ لِلشَّاشَةِ الرَّئِيسِيَّةِ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowIOSGuide(true)}
                className="py-1.5 px-3 rounded-xl bg-purple-600 text-white font-black text-xs shadow-xs hover:bg-purple-700 active:scale-95 transition-all flex items-center gap-1"
              >
                <Share className="w-3.5 h-3.5" />
                <span>كَيْفِيَّةُ التَّثْبِيت</span>
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-2 border-purple-200 text-right">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-slate-900">
                  طَرِيقَةُ الإِضَافَةِ لِلشَّاشَةِ الرَّئِيسِيَّةِ
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-sm font-bold text-slate-700">
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-2xl border border-purple-100">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ١
                  </span>
                  <span>
                    اِضْغَطْ عَلَى زِرِّ <strong>المُشَارَكَةِ (Share)</strong> في شَرِيطِ سَفَارِي السُّفْلِيِّ.
                  </span>
                </div>

                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-2xl border border-purple-100">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ٢
                  </span>
                  <span>
                    مَرِّرْ لِلأَسْفَلِ ثُمَّ اخْتَرْ <strong>إِضَافَة إِلَى الشَّاشَةِ الرَّئِيسِيَّةِ (Add to Home Screen)</strong>.
                  </span>
                </div>

                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-2xl border border-purple-100">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ٣
                  </span>
                  <span>
                    اِضْغَطْ عَلَى <strong>إِضَافَة (Add)</strong> فِي الأَعْلَى لِيَظْهَرَ التَّطْبِيقُ كَأَيِّ تَطْبِيقٍ أَصِيلٍ!
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-3 rounded-2xl bg-purple-600 text-white font-black text-base hover:bg-purple-700 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>فَهِمْتُ ذَلِكَ</span>
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
