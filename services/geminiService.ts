
import { GoogleGenAI, Type, Modality, GenerateContentResponse, LiveSession } from '@google/genai';
import { Personality, TriviaQuestion } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const getTriviaQuestionSchema = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING, description: 'The trivia question text.' },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'An array of 4 multiple-choice answers.',
    },
    correctAnswerIndex: {
      type: Type.INTEGER,
      description: 'The 0-based index of the correct answer in the options array.',
    },
    explanation: {
      type: Type.STRING,
      description: 'A brief, witty explanation for the correct answer, in the persona of the host.'
    }
  },
  required: ['question', 'options', 'correctAnswerIndex', 'explanation'],
};

export async function getTriviaQuestion(personality: Personality): Promise<TriviaQuestion | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a unique, challenging, and interesting trivia question on a random topic. Ensure the information is verifiable. Provide 4 multiple-choice options.`,
      config: {
        systemInstruction: personality.prompt,
        responseMimeType: 'application/json',
        responseSchema: getTriviaQuestionSchema,
        tools: [{ googleSearch: {} }],
      },
    });

    const jsonText = response.text.trim();
    const questionData = JSON.parse(jsonText);
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map(chunk => chunk.web)
        .filter(web => web?.uri && web?.title) as { uri: string; title: string }[] | undefined;

    return { ...questionData, sources: sources || [] };
  } catch (error) {
    console.error("Error fetching trivia question:", error);
    return null;
  }
}

export async function generateSpeech(text: string, voiceName: string): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
}

export async function startConversation(onTranscription: (text: string) => void): Promise<LiveSession> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let currentInputTranscription = '';
    
    const sessionPromise: Promise<LiveSession> = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => {
              console.log('Live session opened');
            },
            onmessage: async (message) => {
                if (message.serverContent?.inputTranscription) {
                    const text = message.serverContent.inputTranscription.text;
                    currentInputTranscription += text;
                }
                if (message.serverContent?.turnComplete) {
                    onTranscription(currentInputTranscription);
                    currentInputTranscription = '';
                }
            },
            onerror: (e) => {
                console.error('Live session error:', e);
            },
            onclose: (e) => {
                console.log('Live session closed');
            },
        },
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
        },
    });

    return sessionPromise;
}
