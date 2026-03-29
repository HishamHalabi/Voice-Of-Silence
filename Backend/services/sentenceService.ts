import geminiService from './geminiService';
import huggingFaceService from './huggingFaceService';
import arabicTextService from './arabicTextService';
import logger from '../utils/logger';

class SentenceService {
    constructor() {
    }

    async processSentence(text: string, userId: string = 'system'): Promise<string> {
        logger.info(`SentenceService Processing: "${text}" (len: ${text.length})`);
        if (!text || !text.trim()) return text;

        if (text.trim().length < 4) {
            logger.debug(`Skipping AI correction for short text: "${text}"`);
            return text;
        }

        try {
            if (process.env.HUGGINGFACE_API_TOKEN) {
                logger.debug(`Processing T1: "${text}"`);
                const corrected = await huggingFaceService.correctSentence(text);
                if (corrected && corrected !== text) return corrected;
            }
        } catch (error: any) {
            logger.warn(`Hugging Face processing failed: ${error.message}`);
        }

        try {
            if (process.env.GEMINI_API_KEY) {
                logger.debug(`Processing T2: "${text}"`);
                const corrected = await geminiService.correctSentence(text);
                if (corrected && corrected !== text) return corrected;
            }
        } catch (error: any) {
            logger.warn(`Gemini processing failed: ${error.message}`);
        }

        try {
            logger.debug(`Processing T3: "${text}"`);
            const userSession = arabicTextService.getSession(userId);
            const words = text.split(' ');
            const sanitizedWords = words.map(w => userSession.getLocalFuzzyMatch(w) || w);
            const lexicalResult = sanitizedWords.join(' ');

            if (lexicalResult !== text) {
                logger.info(`Lexical Fallback applied: [${text}] -> [${lexicalResult}]`);
                return lexicalResult;
            }
        } catch (lexError: any) {
            logger.error(`T3 fallback failed: ${lexError.message}`);
        }

        return text;
    }
}

export default new SentenceService();

