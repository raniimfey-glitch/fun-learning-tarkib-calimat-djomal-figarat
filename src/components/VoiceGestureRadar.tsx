import React from 'react';
import { Mic, MicOff, Sparkles, Hand, Volume2, CheckCircle2 } from 'lucide-react';
import { GestureType } from '../types';

interface VoiceGestureRadarProps {
  isListening: boolean;
  transcript: string;
  activeGesture: GestureType;
  lastActionFeedback: string | null;
  onToggleMic: () => void;
  isOnline: boolean;
}

export const VoiceGestureRadar: React.FC<VoiceGestureRadarProps> = ({
  isListening,
  transcript,
  activeGesture,
  lastActionFeedback,
  onToggleMic,
  isOnline,
}) => {
  const getGestureLabel = (gesture: GestureType) => {
    switch (gesture) {
      case 'swipe-left':
        return '👈 سحب: السؤال التالي';
      case 'swipe-right':
        return '👉 سحب: السابق';
      case 'swipe-down':
        return '👇 سحب: استماع للنطق';
      case 'double-tap':
        return '✨ نقر مزدوج: تحقق من الإجابة';
      case 'long-press':
        return '🔄 ضغط مطول: إعادة الترتيب';
      default:
        return null;
    }
  };

  const gestureLabel = getGestureLabel(activeGesture);

  return (
    <div className="w-full max-w-md mx-auto mb-3 px-2">
      <div className="bg-white/80 backdrop-blur-md border border-purple-100 rounded-2xl p-2.5 shadow-sm transition-all flex items-center justify-between gap-2 text-xs">
        {/* Voice Recognition Status */}
        <div
          onClick={onToggleMic}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
            isListening
              ? 'bg-purple-100 text-purple-800 border border-purple-200'
              : 'bg-slate-100 text-slate-600'
          }`}
          title="انقر لتفعيل أو إيقاف الاستماع الصوتي الذكي"
        >
          {isListening ? (
            <>
              <div className="relative flex items-center justify-center">
                <span className="absolute w-3 h-3 bg-purple-400 rounded-full animate-ping opacity-75" />
                <Mic className="w-3.5 h-3.5 text-purple-700 relative z-10" />
              </div>
              <span className="font-bold">أوامر صوتية مفعّلة</span>
            </>
          ) : (
            <>
              <MicOff className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium">انقر للاستماع</span>
            </>
          )}
        </div>

        {/* Live Feedback / Gestures Guide */}
        <div className="flex-1 text-center font-bold truncate px-2">
          {gestureLabel ? (
            <span className="text-purple-600 animate-pulse">{gestureLabel}</span>
          ) : lastActionFeedback ? (
            <span className="text-emerald-600 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 inline" /> {lastActionFeedback}
            </span>
          ) : transcript ? (
            <span className="text-sky-700 truncate block">🗣️ "{transcript}"</span>
          ) : (
            <span className="text-slate-400 font-medium">
              💡 قل "تحقق"، "التالي" أو اسحب بإصبعك
            </span>
          )}
        </div>

        {/* Online / Offline AI Status */}
        <div
          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 ${
            isOnline
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>{isOnline ? 'ذكاء متصل' : 'وضع بدون إنترنت'}</span>
        </div>
      </div>
    </div>
  );
};
