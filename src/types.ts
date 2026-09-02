export type LevelId = 1 | 2 | 3;

export type QuestionType = 'syllables' | 'sentence' | 'story';

export interface Question {
  id: string;
  type?: QuestionType;
  emoji: string;
  word: string; // The full vocalized Arabic target word or sentence
  plainWord?: string; // Without diacritics for speech matching
  parts: string[]; // Syllables or words
  intruder?: string; // For intruder questions
  sentence?: string; // For missing syllable questions
  answer?: string; // Correct answer part
  choices?: string[]; // Multiple choice parts
  phoneticHint?: string; // Tips on vocalization & articulation
}

export interface LevelConfig {
  id: LevelId;
  title: string;
  subtitle: string;
  badge: string;
  hint: string;
  color: {
    primary: string;
    secondary: string;
    bgGradient: string;
    accent: string;
  };
}

export interface PlacedTile {
  id: string;
  text: string;
  originalIndex: number;
}

export interface AIPronunciationFeedback {
  score: number; // 0 - 100
  accuracy: 'ممتاز' | 'جيد جداً' | 'جيد' | 'حاول مجدداً';
  feedback: string;
  detectedWord: string;
  phoneticBreakdown: {
    syllable: string;
    status: 'correct' | 'needs_work';
    tip: string;
  }[];
  encouragement: string;
  isOfflineFallback?: boolean;
}

export interface SessionResult {
  id: string;
  level: LevelId;
  levelTitle: string;
  score: number;
  total: number;
  date: string;
  timestamp: number;
}

export type GestureType = 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'double-tap' | 'long-press' | 'shake' | null;

export interface VoiceCommandState {
  isListening: boolean;
  transcript: string;
  lastCommand: string | null;
  confidence: number;
  isSupported: boolean;
}
