import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';
import sentenceService from './sentenceService';

interface TrieNode {
    [key: string]: TrieNode | string | undefined;
    $?: string;
}

interface FuzzyResult {
    word: string;
    distance: number;
}

interface ArabicTextState {
    letters: string;
    words: string[];
    sentence: string;
    shouldSpeak: boolean;
}

/**
 * Consolidated Arabic Text Service
 * Handles letter-to-word-to-sentence building with local dictionary-based fuzzy fallback.
 */
class ArabicTextService {
    private letters: string = '';
    private words: string[] = [];
    private lastLetterTime: number = Date.now();
    private maxWordLength: number = 15;
    private sentenceGapMs: number = 5000;
    private autoSpaceMs: number = 1500;

    private static dictionary: Set<string> = new Set();
    private static trie: TrieNode = {};
    private static fuzzyCache: Map<string, string> = new Map();

    constructor() {
        // Static Dictionary & Trie (Shared across user sessions)
        if (ArabicTextService.dictionary.size === 0) {
            this.loadDictionary();
        }
    }

    private loadDictionary(): void {
        try {
            const dictionaryPath = path.join(__dirname, '..', 'data', 'arabic_dictionary.txt');
            if (fs.existsSync(dictionaryPath)) {
                const content = fs.readFileSync(dictionaryPath, 'utf-8');
                const words = content.split('\n').map(w => w.trim()).filter(w => w.length > 0);
                words.forEach(word => ArabicTextService.dictionary.add(word));
                ArabicTextService.trie = this.buildTrie(words);
                logger.info(`Arabic dictionary loaded: ${ArabicTextService.dictionary.size} words`);
            } else {
                this.loadFallbackDictionary();
            }
        } catch (error: any) {
            logger.error(`Error loading dictionary: ${error.message}`);
            this.loadFallbackDictionary();
        }
    }

    private loadFallbackDictionary(): void {
        const fallbackWords = ['السلام', 'عليكم', 'مرحبا', 'شكرا', 'نعم', 'لا', 'مدرسة', 'بيت', 'ماء', 'طعام'];
        fallbackWords.forEach(word => ArabicTextService.dictionary.add(word));
        ArabicTextService.trie = this.buildTrie(fallbackWords);
    }

    private buildTrie(words: string[]): TrieNode {
        const root: TrieNode = {};
        for (const word of words) {
            let node = root;
            for (const char of word) {
                if (!node[char]) node[char] = {};
                node = node[char] as TrieNode;
            }
            node['$'] = word;
        }
        return root;
    }

    /**
     * Add a letter to the building process
     * @param {string} letter - The predicted letter
     * @returns {Promise<ArabicTextState>} State of the sentence
     */
    async addLetter(letter: string): Promise<ArabicTextState> {
        const now = Date.now();

        // Auto-space logic
        if (letter === 'SPACE' || (this.letters && (now - this.lastLetterTime > this.autoSpaceMs))) {
            await this.commitWord();
            if (letter === 'SPACE') return this.getState();
        }

        if (letter !== 'SPACE') {
            this.letters += letter;
            this.lastLetterTime = now;

            if (this.letters.length >= this.maxWordLength) {
                await this.commitWord();
            }
        }

        return this.getState();
    }

    private async commitWord(): Promise<void> {
        if (!this.letters) return;

        // Logic: Try to find best local match for current word
        const bestLocal = this.getLocalFuzzyMatch(this.letters);
        this.words.push(bestLocal || this.letters);
        this.letters = '';
    }

    /**
     * Public wrapper for fuzzy matching a single word
     */
    public getLocalFuzzyMatch(word: string): string | null {
        if (!word) return null;

        // 1. Exact Match (Zero Cost)
        if (ArabicTextService.dictionary.has(word)) return word;

        // 2. Cache Lookup (O(1))
        if (ArabicTextService.fuzzyCache.has(word)) {
            return ArabicTextService.fuzzyCache.get(word)!;
        }

        // 3. Length Safety (Don't fuzzy search tiny words or noise)
        if (word.length < 3) return word;

        // 4. Expensive Fuzzy Search (Trie Traversal)
        const results: FuzzyResult[] = [];
        const maxDistance = 2;
        const currentRow = Array.from({ length: word.length + 1 }, (_, i) => i);

        for (const char in ArabicTextService.trie) {
            if (char !== '$') {
                this.searchTrieFuzzy(ArabicTextService.trie[char] as TrieNode, char, word, currentRow, results, maxDistance);
            }
        }

        let bestMatch = word;
        if (results.length > 0) {
            results.sort((a, b) => a.distance - b.distance);
            bestMatch = results[0].word;
        }

        // 5. Store in Cache
        ArabicTextService.fuzzyCache.set(word, bestMatch);

        // Capping cache size to prevent memory leaks (10k entries)
        if (ArabicTextService.fuzzyCache.size > 10000) {
            const firstKey = ArabicTextService.fuzzyCache.keys().next().value;
            if (firstKey) ArabicTextService.fuzzyCache.delete(firstKey);
        }

        return bestMatch;
    }

    private searchTrieFuzzy(node: TrieNode, char: string, target: string, lastRow: number[], results: FuzzyResult[], maxDistance: number): void {
        const columns = target.length;
        const currentRow = [lastRow[0] + 1];

        for (let j = 1; j <= columns; j++) {
            const insertCost = currentRow[j - 1] + 1;
            const deleteCost = lastRow[j] + 1;
            const replaceCost = (target[j - 1] !== char) ? lastRow[j - 1] + 1 : lastRow[j - 1];
            currentRow[j] = Math.min(insertCost, deleteCost, replaceCost);
        }

        if (currentRow[columns] <= maxDistance && node['$']) {
            results.push({ word: node['$'] as string, distance: currentRow[columns] });
        }

        if (Math.min(...currentRow) <= maxDistance) {
            for (const nextChar in node) {
                if (nextChar !== '$') {
                    this.searchTrieFuzzy(node[nextChar] as TrieNode, nextChar, target, currentRow, results, maxDistance);
                }
            }
        }
    }

    /**
     * Finalize the sentence and apply Cloud -> Local fallback correction
     */
    async processFinalSentence(): Promise<string> {
        if (this.letters) await this.commitWord();

        const rawSentence = this.words.join(' ');
        this.words = [];
        this.letters = '';

        if (!rawSentence.trim()) return "";

        try {
            // Primary: Cloud Correction (Gemini/HF)
            const corrected = await sentenceService.processSentence(rawSentence);
            return corrected || rawSentence;
        } catch (error: any) {
            logger.warn(`Cloud correction failed, using raw gathered words: ${error.message}`);
            return rawSentence;
        }
    }

    getSentence(): string {
        let s = this.words.join(' ');
        if (this.letters) s = s ? `${s} ${this.letters}` : this.letters;
        return s;
    }

    getState(): ArabicTextState {
        return {
            letters: this.letters,
            words: this.words,
            sentence: this.getSentence(),
            shouldSpeak: (Date.now() - this.lastLetterTime > this.sentenceGapMs) && this.words.length > 0
        };
    }

    reset(): void {
        this.letters = '';
        this.words = [];
        this.lastLetterTime = Date.now();
    }
}

// Session Manager (Singleton)
class ArabicTextManager {
    private sessions: Map<string, ArabicTextService> = new Map();

    getSession(userId: string): ArabicTextService {
        if (!this.sessions.has(userId)) {
            this.sessions.set(userId, new ArabicTextService());
        }
        return this.sessions.get(userId)!;
    }

    resetSession(userId: string): void {
        if (this.sessions.has(userId)) this.sessions.get(userId)!.reset();
    }
}

export default new ArabicTextManager();
