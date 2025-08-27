import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
import { useState, useCallback, useEffect } from 'react';
import { PuckType } from "../types";
import { PUCK_TYPE_INFO } from "../constants";

const useGemini = () => {
    const [ai, setAi] = useState<GoogleGenAI | null>(null);

    useEffect(() => {
        const initialize = async () => {
            // Check if the electronAPI is exposed on the window object
            if (window.electronAPI) {
                try {
                    const apiKey = await window.electronAPI.getApiKey();
                    if (apiKey) {
                        const genAI = new GoogleGenAI({ apiKey });
                        setAi(genAI);
                    } else {
                        console.error("API Key not provided from main process.");
                    }
                } catch (e) {
                    console.error("Failed to initialize GoogleGenAI via Electron.", e);
                }
            } else {
                console.warn("Running in a browser environment. Electron API for Gemini is not available.");
            }
        };
        initialize();
    }, []);

    const generateCommentaryStream = useCallback(async (eventDescription: string) => {
        if (!ai) {
            console.error("Gemini AI not initialized.");
            return null;
        }

        const systemInstruction = "You are an excited, over-the-top esports commentator for a futuristic puck game called Pulsar Puck Arena. Your comments must be extremely short, punchy, and full of energy. Use exclamations and impactful words. Focus on the single key event described. Maximum 15 words. Never mention you are an AI. Respond in Spanish.";

        try {
            const contents: Content[] = [{
                role: 'user',
                parts: [{ text: eventDescription }],
            }];

            const responseStream = await ai.models.generateContentStream({
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

    }, [ai]);

    const generateTeamDNA = useCallback(async (puckTypes: PuckType[]): Promise<{ title: string, description: string } | null> => {
        if (!ai || puckTypes.length === 0) {
            return null;
        }

        const puckList = puckTypes.map(puck => PUCK_TYPE_INFO[puck].name).join(', ');

        const systemInstruction = `
You are a strategic analyst for the game Pulsar Puck Arena.
Your task is to analyze a team composition and provide a very brief, thematic "Team DNA" analysis in Spanish.
The response must be in JSON format with two keys: "title" and "description".

- "title": A catchy, thematic name for the team strategy (e.g., "Fortaleza Imparable", "Asalto Relámpago"). Maximum 3 words.
- "description": A very short description of the team's main strength. (e.g., "Una defensa férrea que agota al rival y contraataca con una fuerza demoledora."). Maximum 20 words.

Analyze the synergy and overall strategy based on the provided puck types. Do not list the pucks. Just give the strategic summary.
`;

        try {
            const prompt = `Analyze this team composition: ${puckList}`;
            const contents: Content[] = [{
                role: 'user',
                parts: [{ text: prompt }]
            }];

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents,
                config: {
                    systemInstruction,
                    responseMimeType: 'application/json',
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
    }, [ai]);


    return { generateCommentaryStream, generateTeamDNA };
};

export default useGemini;
