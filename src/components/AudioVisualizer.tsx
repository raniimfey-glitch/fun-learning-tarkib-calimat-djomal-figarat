import React from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  isListening: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  isListening,
  size = 'md',
}) => {
  const active = isPlaying || isListening;

  const barCount = size === 'sm' ? 5 : size === 'lg' ? 9 : 7;
  const heights = [16, 32, 22, 38, 28, 20, 34];
  const barColors = [
    'from-rose-400 to-pink-500',
    'from-amber-400 to-orange-500',
    'from-emerald-400 to-teal-500',
    'from-sky-400 to-blue-500',
    'from-indigo-400 to-purple-500',
    'from-purple-400 to-pink-500',
    'from-rose-400 to-amber-400',
  ];

  return (
    <div
      className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-full transition-all duration-300 ${
        active ? 'bg-white/80 shadow-sm border border-purple-200/60' : 'opacity-40'
      }`}
      aria-label="مؤشر الصوت والموجات"
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <span
          key={i}
          className={`w-2 rounded-full bg-gradient-to-t ${
            barColors[i % barColors.length]
          } transition-all duration-300 ${
            active ? `animate-voice-wave-${(i % 5) + 1} shadow-xs` : 'h-1.5'
          }`}
          style={{
            minHeight: active ? `${heights[i % heights.length]}px` : '4px',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
      {active && (
        <span className="text-[11px] font-black text-purple-700 mr-1 animate-pulse">
          {isPlaying ? 'نطق...' : 'استماع...'}
        </span>
      )}
    </div>
  );
};
