import { useEffect, useRef, useState, useCallback } from 'react';
import { VoiceCommandState } from '../types';
import { playMicPing } from '../utils/soundEngine';

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

interface VoiceCommandOptions {
  targetWord?: string;
  onWordPronounced?: (spokenText: string) => void;
}

export function useVoiceCommander(options: VoiceCommandOptions) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

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
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ar-SA';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        playMicPing(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== 'no-speech') {
          console.warn('Speech Recognition notice:', event.error);
        }
      };

      recognition.onresult = (event: any) => {
        const resultText = event.results?.[0]?.[0]?.transcript || '';
        const clean = resultText.trim();
        if (clean) {
          setTranscript(clean);
          if (optionsRef.current.onWordPronounced) {
            optionsRef.current.onWordPronounced(clean);
          }
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Speech recognition setup error:', err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
      playMicPing(false);
    } else {
      try {
        setTranscript('');
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Recognition start error:', e);
      }
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    isSupported,
    toggleListening,
  };
}
