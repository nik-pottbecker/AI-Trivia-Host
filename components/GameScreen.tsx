
import { LiveSession } from '@google/genai';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getTriviaQuestion, generateSpeech, startConversation } from '../services/geminiService';
import { playAudio } from '../services/audioUtils';
import { TriviaQuestion, Personality, Voice, GameScreenState } from '../types';
import { MicrophoneIcon, SpeakerIcon, CheckIcon, CrossIcon, Spinner } from './icons';

interface GameScreenProps {
  personality: Personality;
  voice: Voice;
  questionNumber: number;
  onQuestionAnswered: (isCorrect: boolean) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ personality, voice, questionNumber, onQuestionAnswered }) => {
  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [status, setStatus] = useState<GameScreenState>('loading');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const sessionRef = useRef<LiveSession | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);


  const speak = useCallback(async (text: string) => {
    const audio = await generateSpeech(text, voice.ttsName);
    if (audio) {
      await playAudio(audio);
    }
  }, [voice.ttsName]);

  const fetchQuestion = useCallback(async () => {
    setStatus('loading');
    setSelectedAnswer(null);
    setIsCorrect(null);
    const q = await getTriviaQuestion(personality);
    if (q) {
      setQuestion(q);
      await speak(q.question);
      setStatus('waiting');
    } else {
      // Handle error case, maybe show an error message and a retry button
      await speak("I seem to have run into a technical difficulty. Let's try another question.");
      fetchQuestion();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personality, speak]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion, questionNumber]);

  const stopListening = useCallback(() => {
    if(streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (audioProcessorRef.current) {
        audioProcessorRef.current.disconnect();
        audioProcessorRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (status === 'listening') {
      setStatus('waiting');
    }
  }, [status]);
  
  const handleTranscription = useCallback((text: string) => {
      stopListening();
      setStatus('processing');
      const lowerText = text.toLowerCase().trim();
      console.log('Transcription:', lowerText);
      if (!question) return;

      let answerIndex = -1;

      // Check for option letters 'a', 'b', 'c', 'd'
      const optionLetters = ['a', 'b', 'c', 'd'];
      for (let i = 0; i < optionLetters.length; i++) {
        if (lowerText.includes(`option ${optionLetters[i]}`) || lowerText === optionLetters[i]) {
          answerIndex = i;
          break;
        }
      }

      // If no letter match, check for answer text
      if (answerIndex === -1) {
        for (let i = 0; i < question.options.length; i++) {
          if (lowerText.includes(question.options[i].toLowerCase())) {
            answerIndex = i;
            break;
          }
        }
      }
      
      if (answerIndex !== -1) {
        handleAnswer(answerIndex);
      } else {
        speak("I'm sorry, I didn't catch that. Please try again or select an option.").then(() => {
            setStatus('waiting');
        });
      }
  }, [question, speak, stopListening]);


  const startListening = useCallback(async () => {
    if (status !== 'waiting') return;
    setStatus('listening');
    try {
        const session = await startConversation(handleTranscription);
        sessionRef.current = session;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        audioContextRef.current = context;
        const source = context.createMediaStreamSource(stream);
        const processor = context.createScriptProcessor(4096, 1, 1);
        audioProcessorRef.current = processor;

        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) {
              int16[i] = inputData[i] * 32768;
            }
             const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(int16.buffer) as unknown as number[]));
             session.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
        };

        source.connect(processor);
        processor.connect(context.destination);
    } catch (err) {
        console.error('Error starting microphone:', err);
        setStatus('waiting');
        speak("I couldn't access your microphone. Please check your browser permissions.");
    }
  }, [status, handleTranscription, speak]);

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);


  const handleAnswer = useCallback(async (index: number) => {
    if (status !== 'waiting' && status !== 'processing') return;
    if (status === 'listening') stopListening();
    setStatus('feedback');
    setSelectedAnswer(index);
    const correct = index === question!.correctAnswerIndex;
    setIsCorrect(correct);
    await speak(question!.explanation);
    onQuestionAnswered(correct);
    setStatus('ended');
  }, [status, question, onQuestionAnswered, speak, stopListening]);
  
  const getButtonClass = (index: number) => {
    const base = 'w-full text-left p-4 rounded-lg border-2 transition-all duration-300 text-lg disabled:opacity-70';
    if (status === 'feedback' || status === 'ended') {
      if (index === question!.correctAnswerIndex) {
        return `${base} bg-green-500/30 border-green-500 ring-4 ring-green-500/50`;
      }
      if (index === selectedAnswer && !isCorrect) {
        return `${base} bg-red-500/30 border-red-500 ring-4 ring-red-500/50`;
      }
      return `${base} border-slate-600 bg-slate-800`;
    }
    return `${base} border-slate-600 bg-slate-800 hover:bg-slate-700 hover:border-${personality.color}-500`;
  };

  if (status === 'loading' || !question) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
          <Spinner className="w-16 h-16 text-white mb-4" />
          <p className="text-xl text-slate-300">Your host is thinking of a question...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
      <div className="w-full max-w-3xl">
        <div className={`p-6 bg-slate-800 rounded-xl shadow-lg border-t-4 border-${personality.color}-500`}>
          <p className="text-sm font-semibold text-slate-400 mb-4">Question {questionNumber} / 5</p>
          <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-6">{question.question}</h2>
          
          <button onClick={() => speak(question.question)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <SpeakerIcon className="w-6 h-6" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={status !== 'waiting'}
                className={getButtonClass(index)}
              >
                <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span> {option}
              </button>
            ))}
          </div>

          {status === 'feedback' && (
             <div className="mt-6 p-4 rounded-lg flex items-center gap-4 bg-slate-900/50">
                {isCorrect ? <CheckIcon className="w-8 h-8 text-green-500 flex-shrink-0" /> : <CrossIcon className="w-8 h-8 text-red-500 flex-shrink-0" />}
                <div>
                  <p className="font-bold text-lg">{isCorrect ? "Correct!" : "Not Quite!"}</p>
                  <p className="text-slate-300">{question.explanation}</p>
                </div>
            </div>
          )}

           {question.sources && question.sources.length > 0 && (status === 'feedback' || status === 'ended') && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-sm text-slate-400 font-semibold mb-2">Sources:</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                {question.sources.map((source, index) => (
                  <a key={index} href={source.uri} target="_blank" rel="noopener noreferrer" className={`text-${personality.color}-400 hover:underline`}>
                    {source.title || new URL(source.uri).hostname}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center">
        {status === 'waiting' && (
             <button onClick={startListening} className={`flex items-center gap-3 px-8 py-4 bg-${personality.color}-600 text-white font-bold rounded-full text-lg shadow-lg hover:bg-${personality.color}-700 transition-transform transform hover:scale-105`}>
                <MicrophoneIcon className="w-6 h-6" />
                Tap to Answer with Voice
            </button>
        )}
        {status === 'listening' && (
            <button onClick={stopListening} className={`flex items-center gap-3 px-8 py-4 bg-slate-600 text-white font-bold rounded-full text-lg shadow-lg`}>
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Listening... (Tap to Cancel)
            </button>
        )}
        </div>
      </div>
    </div>
  );
};

export default GameScreen;
