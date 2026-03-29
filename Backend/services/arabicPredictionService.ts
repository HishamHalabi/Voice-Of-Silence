import logger from '../utils/logger';

interface PredictionResult {
    letter: string | null;
    fingerIndex?: number;
    md?: number;
    error?: string;
}

class ArabicPredictionService {
    private A_thresh: number[];
    private letterGroups: string[][];

    constructor() {
        this.A_thresh = [400, 400, 400, 400, 400];

        this.letterGroups = [
            ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ'],      
            ['د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص'],      
            ['ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق'],      
            ['ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'],      
            ['ء', 'ة', 'لا', 'إ', 'أ', 'ؤ', 'SPACE']  
        ];
    }

    predict(sensorData: number[]): PredictionResult {
        try {
            if (!Array.isArray(sensorData) || sensorData.length < 7) {
                return { letter: null, error: 'Invalid sensor data length' };
            }

            const discretizedA = sensorData.slice(0, 5).map((val, i) => val > this.A_thresh[i] ? 1 : 0);

            let fingerIndex = discretizedA.indexOf(1);

            if (fingerIndex === -1) {
                return { letter: null };
            }

            const discretizeB = (val: number) => {
                if (val < 341) return 0;
                if (val < 682) return 1;
                return 2;
            };

            const b1 = discretizeB(sensorData[5]);
            const b2 = discretizeB(sensorData[6]);

            let md = (b1 * 3 + b2);
            if (md > 6) md = 6;

            const letter = this.letterGroups[fingerIndex][md];

            return {
                letter,
                fingerIndex,
                md
            };
        } catch (error: any) {
            logger.error(`Prediction error: ${error.message}`);
            return { letter: null, error: error.message };
        }
    }
}

export default new ArabicPredictionService();

