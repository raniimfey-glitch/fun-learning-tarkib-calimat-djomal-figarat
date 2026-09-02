import { useEffect, useRef, useState } from 'react';
import { GestureType } from '../types';

interface GestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  onSwipeUp?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onShake?: () => void;
  minSwipeDistance?: number;
}

export function useGestureCommander(options: GestureOptions) {
  const [activeGesture, setActiveGesture] = useState<GestureType>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const minDistance = options.minSwipeDistance ?? 45;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const now = Date.now();

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: now,
      };

      // Double tap check (< 300ms between taps)
      if (now - lastTapTimeRef.current < 300) {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        setActiveGesture('double-tap');
        if (options.onDoubleTap) options.onDoubleTap();
        lastTapTimeRef.current = 0;
        return;
      }
      lastTapTimeRef.current = now;

      // Long press detection (> 650ms)
      longPressTimerRef.current = setTimeout(() => {
        setActiveGesture('long-press');
        if (options.onLongPress) options.onLongPress();
      }, 650);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      // Cancel long press if finger moves significantly
      if (deltaX > 15 || deltaY > 15) {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (Math.max(absX, absY) > minDistance) {
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX < 0) {
            // Swiped left (in RTL, next)
            setActiveGesture('swipe-left');
            if (options.onSwipeLeft) options.onSwipeLeft();
          } else {
            // Swiped right (in RTL, previous)
            setActiveGesture('swipe-right');
            if (options.onSwipeRight) options.onSwipeRight();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            // Swiped down (Listen / pronounce)
            setActiveGesture('swipe-down');
            if (options.onSwipeDown) options.onSwipeDown();
          } else {
            // Swiped up
            setActiveGesture('swipe-up');
            if (options.onSwipeUp) options.onSwipeUp();
          }
        }
      }

      touchStartRef.current = null;
      setTimeout(() => setActiveGesture(null), 800);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, [options, minDistance]);

  return { activeGesture };
}
