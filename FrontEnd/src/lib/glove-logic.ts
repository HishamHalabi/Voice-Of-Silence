import { GLOVE_CONFIG } from '@/config/glove-config';

export const GLOVE_LOGIC_INTERNAL_CONFIG = {
    baudRate: 9600,
    requiredSensors: 2,
    portFilters: [] // Empty to allow all serial devices
};


export const LETTER_GROUPS = [
    ['ا', 'ب', 'ت', 'ث', 'ج', 'ح'],      // Finger 1 (A1)
    ['خ', 'د', 'ز', 'ر', 'ز', 'س'],      // Finger 2 (A2)
    ['ش', 'ص', 'ض', 'ط', 'ظ', 'ع'],      // Finger 3 (A3)
    ['غ', 'ف', 'ق', 'ك', 'ل', 'م'],      // Finger 4 (A4)
    ['ن', 'ه', 'و', 'ي', ' ', ' '],      // Finger 5 (A5)
    ['لا', 'إ', 'أ', 'ؤ', ' ', ' ']      // Finger 6 (Optional, last 2 are SPACE)
];

export interface GloveState {
    arduino1Data: number[];
    arduino2Data: number[];
    minValues: number[];
    maxValues: number[];
}

export function getNormalizedSensors(sensors: number[], minValues: number[], maxValues: number[]) {
    if (!sensors || sensors.length < 7) return Array(7).fill(0);
    const inputs: number[] = [];
    for (let i = 0; i < 7; i++) {
        // Fallback to 0 and 1023 if uncalibrated to allow immediate HUD feedback
        let min = minValues[i] === 1023 ? 0 : minValues[i];
        let max = maxValues[i] === 0 ? 1023 : maxValues[i];
        let val = sensors[i];

        let range = max - min;
        if (range <= 0) {
            inputs[i] = 0;
        } else {
            const clamped = Math.max(min, Math.min(max, val));
            inputs[i] = (clamped - min) / range;
        }
    }
    return inputs;
}

export function getBinarySensors(sensors: number[], minValues: number[], maxValues: number[]) {
    const normalized = getNormalizedSensors(sensors, minValues, maxValues);
    return normalized.map(val => val > GLOVE_CONFIG.THRESHOLDS.FINGERS ? 1 : 0);
}

export function predictGloveLetter(sensors: number[], minValues: number[], maxValues: number[]) {
    if (!sensors || sensors.length < 7) return null;

    const binary = getBinarySensors(sensors, minValues, maxValues);

    let fingerIndex = -1;
    for (let i = 0; i < 5; i++) {
        if (binary[i] === 1) {
            fingerIndex = i;
            break;
        }
    }

    if (fingerIndex === -1) return null;

    const discretizeB1 = (val: number, idx: number) => {
        let min = minValues[idx];
        let max = maxValues[idx];
        let range = max - min;
        if (range <= 0) range = 1023;
        const clamped = Math.max(min, Math.min(max, val));
        const norm = (clamped - min) / range;

        return norm > GLOVE_CONFIG.THRESHOLDS.B1_INVERTED ? 0 : 1;
    };

    const discretizeB2 = (val: number, idx: number) => {
        let min = minValues[idx];
        let max = maxValues[idx];
        let range = max - min;
        if (range <= 0) range = 1023;
        const clamped = Math.max(min, Math.min(max, val));
        const norm = (clamped - min) / range;

        if (norm < GLOVE_CONFIG.THRESHOLDS.B2.STATE_2) return 2;
        if (norm < GLOVE_CONFIG.THRESHOLDS.B2.STATE_1) return 1;
        return 0;
    };

    const b1 = discretizeB1(sensors[5], 5);
    const b2 = discretizeB2(sensors[6], 6);

    let md = (b1 * 3 + b2);

    if (!LETTER_GROUPS[fingerIndex]) return null;

    const targetLetter = LETTER_GROUPS[fingerIndex][md];
    if (!targetLetter) return null;

    const activeCount = binary.slice(0, 5).filter(v => v === 1).length;
    let confidence = activeCount === 1 ? 0.95 : activeCount > 1 ? 0.6 : 0.2;

    return {
        letter: targetLetter,
        confidence: parseFloat(confidence.toFixed(2))
    };
}


export class LineBreakTransformer {
    container: string = "";
    transform(chunk: string, controller: TransformStreamDefaultController) {
        this.container += chunk;
        const lines = this.container.split("\n");
        this.container = lines.pop() || "";
        lines.forEach(line => controller.enqueue(line));
    }
    flush(controller: TransformStreamDefaultController) {
        controller.enqueue(this.container);
    }
}
