import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import logger from '../utils/logger';
import { createError } from '../utils/response';

declare const fetch: any;

interface TTSResult {
    audioContent: string | null;
}

class TTSService {
    private outputDir: string;

    private get config() {
        return {
            masriUrl: process.env.GHAYMAH_API_URL || 'https://arabic-tts-1-52149f99.hosted.cumin.dev/v1/audio/speech',
            voiceId: process.env.GHAYMAH_VOICE_ID || 'en-US-AndrewMultilingualNeural',
            apiKey: process.env.GHAYMAH_API_KEY || 'afakapi',
            elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
            elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb'
        };
    }

    constructor() {
        this.outputDir = './public/audio/tts';
        this.ensureOutputDir();
    }

    private ensureOutputDir(): void {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    async textToSpeech(text: string, languageCode: string = 'ar'): Promise<TTSResult> {
        try {
            if (!text || text.trim().length === 0) {
                throw createError('Text is required', 400);
            }

            logger.info(`Generating TTS for: "${text}"`);

            try {
                return await this.ghaymahTTS(text);
            } catch (err) {
                logger.warn('Ghaymah TTS failed, trying ElevenLabs fallback...');
            }

            try {
                return await this.elevenLabsTTS(text);
            } catch (err) {
                logger.warn('ElevenLabs TTS failed, moving to final fallback...');
            }

            return this.fallbackTTS(text);

        } catch (error: any) {
            logger.error(`TTS Final error: ${error.message}`);
            return { audioContent: null };
        }
    }

    private async ghaymahTTS(text: string): Promise<TTSResult> {
        const { masriUrl, voiceId, apiKey } = this.config;

        try {
            const payload = {
                model: 'tts-1',
                input: text,
                voice: voiceId,
                response_format: 'mp3'
            };

            const response = await fetch(masriUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Ghaymah API failed: ${response.status} ${errText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Audio = buffer.toString('base64');

            return { audioContent: base64Audio };

        } catch (err: any) {
            logger.error(`Ghaymah TTS error: ${err.message}`);
            throw err;
        }
    }

    private async elevenLabsTTS(text: string): Promise<TTSResult> {
        const { elevenLabsApiKey, elevenLabsVoiceId } = this.config;

        if (!elevenLabsApiKey) {
            throw new Error('ElevenLabs API Key not configured');
        }

        try {
            const url = `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'xi-api-key': elevenLabsApiKey,
                    'Content-Type': 'application/json',
                    'Accept': 'audio/mpeg'
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`ElevenLabs API failed: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Audio = buffer.toString('base64');

            return { audioContent: base64Audio };

        } catch (err: any) {
            logger.error(`ElevenLabs TTS error: ${err.message}`);
            throw err;
        }
    }

    private async fallbackTTS(text: string): Promise<TTSResult> {
        try {
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(text)}&tl=ar`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            if (!response.ok) {
                throw new Error('Google TTS failed');
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            return { audioContent: buffer.toString('base64') };

        } catch (err: any) {
            logger.error(`Fallback TTS failed: ${err.message}`);
            return { audioContent: null };
        }
    }
}

export default new TTSService();

