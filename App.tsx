
import React, { useState, useCallback } from 'react';
import PersonalitySelector from './components/PersonalitySelector';
import GameScreen from './components/GameScreen';
import EndScreen from './components/EndScreen';
import { GameState, Personality, Voice } from './types';
import { TOTAL_QUESTIONS, PERSONALITIES, VOICES } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('personality-select');
  const [score, setScore] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [personality, setPersonality] = useState<Personality>(PERSONALITIES[0]);
  const [voice, setVoice] = useState<Voice>(VOICES[0]);

  const handleStartGame = useCallback((p: Personality, v: Voice) => {
    setPersonality(p);
    setVoice(v);
    setScore(0);
    setQuestionNumber(1);
    setGameState('playing');
  }, []);

  const handleQuestionAnswered = useCallback((isCorrect: boolean) => {
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    // Use a timeout to allow feedback animation to play
    setTimeout(() => {
        if (questionNumber < TOTAL_QUESTIONS) {
            setQuestionNumber(prev => prev + 1);
        } else {
            setGameState('game-over');
        }
    }, 2000); // A delay before moving to next question or end screen
  }, [questionNumber]);

  const handleRestart = useCallback(() => {
    setGameState('personality-select');
  }, []);

  const renderContent = () => {
    switch (gameState) {
      case 'personality-select':
        return <PersonalitySelector onStartGame={handleStartGame} />;
      case 'playing':
        return (
          <GameScreen
            personality={personality}
            voice={voice}
            questionNumber={questionNumber}
            onQuestionAnswered={handleQuestionAnswered}
          />
        );
      case 'game-over':
        return <EndScreen score={score} onRestart={handleRestart} personality={personality} />;
      default:
        return null;
    }
  };

  return <div className="App">{renderContent()}</div>;
};

export default App;
