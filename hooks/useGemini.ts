
import { GoogleGenAI } from "@google/genai";
import { useState, useCallback } from 'react';
import { Language } from '../constants';

const useGemini = () => {
    const [ai, setAi] = useState<GoogleGenAI | null>(null);

    const initialize = useCallback(() => {
        if (!ai) {
             try {
                // Fix: Correct initialization using named parameter as per @google/genai guidelines.
                const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
                setAi(genAI);
                return genAI;
             } catch (e) {
                 console.error("Failed to initialize GoogleGenAI. Ensure API_KEY is set.", e);
                 return null;
             }
        }
        return ai;
    }, [ai]);

    const generateCommentaryStream = useCallback(async (eventDescription: string, lang: Language) => {
        const genAI = initialize();
        if (!genAI) return null;

        const langName = lang === 'es' ? 'Spanish' : 'English';
        const gameName = lang === 'es' ? 'Pin Pan Pum' : 'Wham Bam Boom';

        const systemInstruction = `You are an excited, over-the-top esports commentator for a futuristic puck game called ${gameName}. Your comments must be extremely short, punchy, and full of energy. Use exclamations and impactful words. Focus on the single key event described. Maximum 15 words. Never mention you are an AI. Respond in ${langName}.`;

        try {
            // Fix: Use gemini-3-flash-preview for text-based tasks as per the recommended model mapping.
            const responseStream = await genAI.models.generateContentStream({
                model: "gemini-3-flash-preview",
                contents: eventDescription,
                config: {
                    systemInstruction: systemInstruction,
                }
            });

            return responseStream;
            
        } catch (error) {
            console.error("Error generating commentary stream:", error);
            return null;
        }

    }, [initialize]);

    return { generateCommentaryStream };
};

export default useGemini;
