import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import logger from '../utils/logger';

class GeminiService {
    private get apiKey(): string | undefined {
        return process.env.GEMINI_API_KEY;
    }

    private get genAI(): GoogleGenerativeAI | null {
        const key = this.apiKey;
        return key ? new GoogleGenerativeAI(key) : null;
    }

    private get modelName(): string {
        return "gemini-2.0-flash";
    }

    private getModel(name: string): GenerativeModel | null {
        const ai = this.genAI;
        return ai ? ai.getGenerativeModel({ model: name }) : null;
    }

    async correctSentence(text: string): Promise<string> {
        let currentModelName = this.modelName;
        let model = this.getModel(currentModelName);

        if (!model) {
            throw new Error("Gemini API not configured");
        }

        try {
            const prompt = `
            You are an expert Arabic assistant. 
            Task: Correct the grammar and spelling of the following Arabic text.
            Input: "${text}"
            
            Strict Rules:
            1. Output ONLY the corrected text.
            2. DO NOT expand fragments into sentences.
            3. DO NOT add any information that wasn't in the input.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error: any) {
            logger.error(`Gemini Service Error (${currentModelName}): ${error.message}`);

            // Specific handling for Quota Exceeded (429)
            if (error.message.includes("429") || error.message.includes("quota")) {
                logger.warn("Gemini Quota Exceeded. Service will fallback to Hugging Face.");
                throw new Error("GEMINI_QUOTA_EXCEEDED");
            }

            // Auto-fallback to gemini-pro if flash fails with a not found error
            if (error.message.includes("not found") && currentModelName !== "gemini-pro") {
                logger.info("Retrying with gemini-pro...");
                const fallbackModel = this.getModel("gemini-pro");
                if (fallbackModel) {
                    const result = await fallbackModel.generateContent(`Correct the grammar of this Arabic sentence: "${text}". Output only the corrected text.`);
                    const response = await result.response;
                    return response.text().trim();
                }
            }
            throw error;
        }
    }
}

export default new GeminiService();
