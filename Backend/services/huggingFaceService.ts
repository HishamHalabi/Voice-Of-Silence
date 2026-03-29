import logger from '../utils/logger';

// Assuming global fetch is available or handled by types
declare const fetch: any;

interface HFChoice {
    message?: {
        content: string;
    };
}

interface HFResponse {
    choices?: HFChoice[];
}

class HuggingFaceService {
    private get modelId(): string {
        return process.env.HUGGINGFACE_MODEL_ID || 'CohereLabs/c4ai-command-r7b-arabic-02-2025';
    }

    private get apiUrl(): string {
        return `https://router.huggingface.co/v1/chat/completions`;
    }

    private get token(): string | undefined {
        return process.env.HUGGINGFACE_API_TOKEN;
    }

    /**
     * Correct Arabic sentence using Hugging Face Inference API
     * @param {string} text - Raw Arabic text
     * @returns {Promise<string>} - Corrected text
     */
    async correctSentence(text: string): Promise<string> {
        if (!text || text.trim().length < 4) return text;

        const token = this.token;
        if (!token) {
            logger.warn('HUGGINGFACE_API_TOKEN not set, skipping HF processing');
            throw new Error('HUGGINGFACE_API_TOKEN_MISSING');
        }

        try {
            logger.info(`Processing with Hugging Face Chat Router: "${text}" using model "${this.modelId}"`);

            // Use Chat format as requested by the Router's OpenAI-compatible endpoint
            const payload = {
                model: this.modelId,
                messages: [
                    {
                        role: "user",
                        content: `Correct the following Arabic sentence. If it is a single word or fragment, only correct spellings. DO NOT add new words or expand into a full sentence. Respond ONLY with the corrected text: ${text}`
                    }
                ],
                max_tokens: 128,
                temperature: 0.3
            };
            const startTime = Date.now();
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const responseText = await response.text();
            let result: HFResponse;

            try {
                result = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`HF API Response not JSON: ${responseText.substring(0, 100)}`);
            }

            if (!response.ok) {
                throw new Error(`HF API Error (${response.status}): ${JSON.stringify(result)}`);
            }

            const endTime = Date.now();
            logger.debug(`HF Processing took ${endTime - startTime}ms`);

            if (result.choices && result.choices[0]?.message?.content) {
                return result.choices[0].message.content.trim();
            }

            return text;
        } catch (error: any) {
            logger.error(`Hugging Face API processing failed: ${error.message}`);
            throw error;
        }
    }
}

export default new HuggingFaceService();
