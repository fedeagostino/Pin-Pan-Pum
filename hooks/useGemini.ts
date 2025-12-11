import { GoogleGenAI } from "@google/genai";
import { useState, useCallback } from 'react';

const useGemini = () => {
    const [ai, setAi] = useState<GoogleGenAI | null>(null);

    // Initialize lazily on first use
    const initialize = useCallback(() => {
        if (!ai) {
             try {
                // This relies on `process.env.API_KEY` being set in the environment.
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

    const generateCommentaryStream = useCallback(async (eventDescription: string) => {
        const genAI = initialize();
        if (!genAI) {
            console.error("Gemini AI not initialized.");
            return null;
        }

        const systemInstruction = "You are an excited, over-the-top esports commentator for a futuristic puck game called Pulsar Puck Arena. Your comments must be extremely short, punchy, and full of energy. Use exclamations and impactful words. Focus on the single key event described. Maximum 15 words. Never mention you are an AI. Respond in Spanish.";

        try {
            const responseStream = await genAI.models.generateContentStream({
                model: "gemini-2.5-flash",
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
