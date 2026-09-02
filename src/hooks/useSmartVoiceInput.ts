import { useEffect, useRef, useState, useCallback } from 'react';
import { Question, LevelId } from '../types';
import { isWordMatch, isSentenceMatch, isStoryMatch } from '../utils/arabicMatcher';
import { playMicPing, stopAllSpeech } from '../utils/soundEngine';

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

interface SmartVoiceInputProps {
  currentQ: Question | null;
  level: LevelId;
  onCorrectAnswer: (matchedIndices?: number[]) => void;
  onTimeout?: () => void;
  onError?: (errorMessage: string) => void;
}

const COUNTDOWN_SECONDS = 15;

export function useSmartVoiceInput({
  currentQ,
  level,
  onCorrectAnswer,
  onTimeout,
  onError,
}: SmartVoiceInputProps) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(COUNTDOWN_SECONDS);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const countdownRef = useRef<number>(COUNTDOWN_SECONDS);
  const currentQRef = useRef(currentQ);
  const levelRef = useRef(level);
  const onCorrectAnswerRef = useRef(onCorrectAnswer);
  const onTimeoutRef = useRef(onTimeout);
  const onErrorRef = useRef(onError);

  // Sync refs to avoid stale closures
  currentQRef.current = currentQ;
  levelRef.current = level;
  onCorrectAnswerRef.current = onCorrectAnswer;
  onTimeoutRef.current = onTimeout;
  onErrorRef.current = onError;

  // Cleanup helper
  const stopAll = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    countdownRef.current = COUNTDOWN_SECONDS;
    setCountdown(COUNTDOWN_SECONDS);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Process and test spoken text against the current question
  const evaluateSpokenInput = useCallback((spokenText: string) => {
    const q = currentQRef.current;
    if (!q || !spokenText.trim()) return;

    const currentLevel = levelRef.current;
    let matched = false;
    let matchedIndices: number[] | undefined;

    if (currentLevel === 1) {
      // Words from syllables
      matched = isWordMatch(spokenText, q.word, q.plainWord, q.parts);
    } else if (currentLevel === 2) {
      // Sentences from words
      matched = isSentenceMatch(spokenText, q.word, q.parts);
    } else {
      // Level 3: Story paragraphs from sentences
      const result = isStoryMatch(spokenText, q.word, q.parts);
      if (result.isFullMatch) {
        matched = true;
      } else if (result.matchedSentenceIndices.length > 0) {
        matched = true;
        matchedIndices = result.matchedSentenceIndices;
      }
    }

    if (matched) {
      // Successfully recognized the correct answer!
      stopAll();
      playMicPing(false);
      if (onCorrectAnswerRef.current) {
        onCorrectAnswerRef.current(matchedIndices);
      }
    }
  }, [stopAll]);

  // Setup SpeechRecognition instance
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ar-SA';
      recognition.maxAlternatives = 2;

      recognition.onstart = () => {
        // Listening started
      };

      recognition.onresult = (event: any) => {
        let combined = '';
        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item?.[0]?.transcript) {
            combined += ' ' + item[0].transcript;
          }
        }

        const clean = combined.trim();
        if (clean) {
          setLiveTranscript(clean);
          evaluateSpokenInput(clean);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          stopAll();
          if (onErrorRef.current) {
            onErrorRef.current('يرجى السماح بصلاحية الميكروفون لاستخدام النطق الذكي');
          }
        }
      };

      recognition.onend = () => {
        // Auto-restart if we are still within the 15 seconds countdown window
        if (isListeningRef.current && countdownRef.current > 0) {
          try {
            recognition.start();
          } catch (e) {
            // ignore
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('SpeechRecognition initialization error:', err);
      setIsSupported(false);
    }

    return () => {
      stopAll();
    };
  }, [evaluateSpokenInput, stopAll]);

  // Automatically reset and stop when question or level changes
  useEffect(() => {
    stopAll();
  }, [currentQ?.id, level, stopAll]);

  // Start the 15-second countdown and speech recognition
  const startListening = useCallback(() => {
    stopAllSpeech();
    playMicPing(true);

    // Reset states
    setLiveTranscript('');
    countdownRef.current = COUNTDOWN_SECONDS;
    setCountdown(COUNTDOWN_SECONDS);
    isListeningRef.current = true;
    setIsListening(true);

    // Start 15s interval countdown
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    countdownTimerRef.current = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);

      if (countdownRef.current <= 0) {
        // 15 seconds timeout reached!
        stopAll();
        playMicPing(false);
        if (onTimeoutRef.current) {
          onTimeoutRef.current();
        }
      }
    }, 1000);

    // Start recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // If already started, ignore
      }
    }
  }, [stopAll]);

  // Stop listening manually (e.g. user taps button again to cancel)
  const stopListening = useCallback(() => {
    stopAll();
    playMicPing(false);
  }, [stopAll]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    countdown,
    liveTranscript,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}
