
import React, { useState } from 'react';
import { Personality, Voice } from '../types';
import { PERSONALITIES, VOICES } from '../constants';

interface PersonalitySelectorProps {
  onStartGame: (personality: Personality, voice: Voice) => void;
}

const PersonalitySelector: React.FC<PersonalitySelectorProps> = ({ onStartGame }) => {
  const [selectedPersonality, setSelectedPersonality] = useState<Personality>(PERSONALITIES[0]);
  const [selectedVoice, setSelectedVoice] = useState<Voice>(VOICES[0]);

  const colorMap: { [key: string]: string } = {
    purple: 'border-purple-500 ring-purple-500/50 text-purple-400',
    blue: 'border-blue-500 ring-blue-500/50 text-blue-400',
    red: 'border-red-500 ring-red-500/50 text-red-400',
  };
  
  const bgColorMap: { [key: string]: string } = {
    purple: 'bg-purple-500 hover:bg-purple-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    red: 'bg-red-500 hover:bg-red-600',
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold text-white mb-2">AI Trivia Host</h1>
        <p className="text-slate-400 text-lg">Choose your host and get ready to play!</p>
      </div>

      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">1. Choose a Personality</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PERSONALITIES.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPersonality(p)}
                className={`p-6 rounded-lg text-left transition-all duration-200 transform hover:scale-105 ${
                  selectedPersonality.id === p.id
                    ? `border-2 ${colorMap[p.color]} bg-slate-800/50 ring-4`
                    : 'bg-slate-800 border-2 border-slate-700 hover:border-slate-500'
                }`}
              >
                <h3 className={`text-xl font-bold ${selectedPersonality.id === p.id ? colorMap[p.color].split(' ')[2] : 'text-white'}`}>{p.name}</h3>
                <p className="text-slate-400 mt-2 text-sm">{p.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Choose a Voice</h2>
            <div className="flex flex-wrap gap-3">
                 {VOICES.map((v) => (
                    <button
                        key={v.id}
                        onClick={() => setSelectedVoice(v)}
                        className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                            selectedVoice.id === v.id
                                ? `${bgColorMap[selectedPersonality.color]} text-white shadow-lg`
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        {v.name}
                    </button>
                ))}
            </div>
        </div>

        <button
          onClick={() => onStartGame(selectedPersonality, selectedVoice)}
          className={`w-full py-4 text-xl font-bold text-white rounded-lg shadow-lg transition-transform transform hover:scale-102 ${bgColorMap[selectedPersonality.color]}`}
        >
          Start Game
        </button>
      </div>
    </div>
  );
};

export default PersonalitySelector;
