
import React from 'react';
import { Personality } from '../types';
import { TOTAL_QUESTIONS } from '../constants';

interface EndScreenProps {
  score: number;
  onRestart: () => void;
  personality: Personality;
}

const EndScreen: React.FC<EndScreenProps> = ({ score, onRestart, personality }) => {
  const bgColorMap: { [key: string]: string } = {
    purple: 'bg-purple-500 hover:bg-purple-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    red: 'bg-red-500 hover:bg-red-600',
  };

  const getFeedback = () => {
    const percentage = (score / TOTAL_QUESTIONS) * 100;
    if (percentage === 100) return "Perfect score! You're a trivia legend!";
    if (percentage >= 80) return "Incredible! You really know your stuff.";
    if (percentage >= 50) return "Nice job! A solid performance.";
    if (percentage >= 20) return "Not bad! A little more practice and you'll be a pro.";
    return "Hey, participation is what counts, right?";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-slate-800 p-10 rounded-xl shadow-2xl max-w-lg w-full">
        <h1 className="text-5xl font-bold text-white mb-4">Game Over!</h1>
        <p className="text-slate-300 text-xl mb-6">{getFeedback()}</p>
        <div className="text-6xl font-bold text-white mb-8">
          You Scored <span className={`text-${personality.color}-400`}>{score}</span> / {TOTAL_QUESTIONS}
        </div>
        <button
          onClick={onRestart}
          className={`w-full py-3 text-lg font-bold text-white rounded-lg shadow-lg transition-transform transform hover:scale-105 ${bgColorMap[personality.color]}`}
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default EndScreen;
