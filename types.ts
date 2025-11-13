
export type GameState = 'personality-select' | 'playing' | 'game-over';

export interface Personality {
  id: string;
  name: string;
  description: string;
  prompt: string;
  color: string;
}

export interface Voice {
  id: string;
  name: string;
  ttsName: string;
}

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  sources?: { uri: string; title: string }[];
}

export type GameScreenState =
  | 'loading'
  | 'waiting'
  | 'listening'
  | 'processing'
  | 'feedback'
  | 'ended';
