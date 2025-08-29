import { GoogleGenAI, GenerateContentResponse, Content, Type } from "@google/genai";
import { useCallback } from 'react';
import { PuckType } from "../types";
import { PUCK_TYPE_INFO } from "../constants";

let ai: GoogleGenAI | null = null;

const initialize = () => {
    if (!ai) {
        try {
            // This relies on `process.env.API_KEY` being set in the environment.
            ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        } catch (e) {
            console.error("Failed to initialize GoogleGenAI. Ensure API_KEY is set.", e);
        }
    }
    return ai;
};

const useGemini = () => {
    const generateCommentaryStream = useCallback(async (eventDescription: string) => {
        const genAI = initialize();
        if (!genAI) {
            console.error("Gemini AI not initialized.");
            return null;
        }

        const systemInstruction = "You are an excited, over-the-top esports commentator for a futuristic puck game called Pulsar Puck Arena. Your comments must be extremely short, punchy, and full of energy. Use exclamations and impactful words. Focus on the single key event described. Maximum 15 words. Never mention you are an AI. Respond in Spanish.";

        try {
            const contents: Content[] = [{
                role: 'user',
                parts: [{ text: eventDescription }],
            }];

            const responseStream = await genAI.models.generateContentStream({
                model: "gemini-2.5-flash",
                contents: contents,
                config: {
                    systemInstruction: systemInstruction,
                }
            });

            return responseStream;
            
        } catch (error) {
            console.error("Error generating commentary stream:", error);
            return null;
        }

    }, []);

    const generateTeamDNA = useCallback(async (puckTypes: PuckType[]): Promise<{ title: string, description: string } | null> => {
        const genAI = initialize();
        if (!genAI || puckTypes.length === 0) {
            return null;
        }

        const puckList = puckTypes.map(puck => PUCK_TYPE_INFO[puck].name).join(', ');

        const systemInstruction = `
You are a strategic analyst for the game Pulsar Puck Arena.
Your task is to analyze a team composition and provide a very brief, thematic "Team DNA" analysis in Spanish.
The response must be in JSON format.

- The "title" should be a catchy, thematic name for the team strategy (e.g., "Fortaleza Imparable", "Asalto Relámpago"). Maximum 3 words.
- The "description" should be a very short description of the team's main strength. (e.g., "Una defensa férrea que agota al rival y contraataca con una fuerza demoledora."). Maximum 20 words.

Analyze the synergy and overall strategy based on the provided puck types. Do not list the pucks. Just give the strategic summary.
`;

        try {
            const prompt = `Analyze this team composition: ${puckList}`;
            
            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING }
                        },
                        required: ["title", "description"],
                    }
                }
            });
            
            const text = response.text.trim();
            // Basic validation to ensure it's a JSON object
            if (text.startsWith('{') && text.endsWith('}')) {
                const parsed = JSON.parse(text);
                if (parsed.title && parsed.description) {
                    return parsed;
                }
            }
            throw new Error("Invalid JSON response format");

        } catch (error) {
            console.error("Error generating Team DNA:", error);
            // Fallback for safety
            return {
                title: "Equipo Versátil",
                description: "Una selección equilibrada lista para cualquier desafío."
            };
        }
    }, []);


    return { generateCommentaryStream, generateTeamDNA };
};

export default useGemini;
