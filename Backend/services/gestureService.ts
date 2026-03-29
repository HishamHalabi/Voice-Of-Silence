import logger from '../utils/logger';

interface SensorData {
    flexSensors: number[];
    timestamp?: number;
}

class GestureService {
    normalizeSensorData(sensorData: SensorData): number[] {
        try {
            if (sensorData.flexSensors && Array.isArray(sensorData.flexSensors)) {
                return sensorData.flexSensors; 
            }

            return [];
        } catch (error: any) {
            logger.error(`Error processing sensor data: ${error.message}`);
            throw new Error('Failed to process sensor data');
        }
    }

    validateSensorData(sensorData: SensorData | null): boolean {
        if (!sensorData) {
            return false;
        }

        const hasFlexSensors = sensorData.flexSensors &&
            Array.isArray(sensorData.flexSensors) &&
            sensorData.flexSensors.length === 7 &&
            sensorData.flexSensors.every(val => typeof val === 'number');

        return !!hasFlexSensors;
    }
}

export default new GestureService();

