import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGestureData extends Document {
    user: Types.ObjectId;
    sensorData: {
        flexSensors: number[];
        timestamp: number;
    };
    predictedLetter?: string;
    confidence: number;
    isFrontendData: boolean;
    isTrainingData: boolean;
    actualLetter?: string;
    deviceInfo?: {
        deviceId?: string;
        firmwareVersion?: string;
        batteryLevel?: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const gestureDataSchema = new Schema<IGestureData>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sensorData: {
        // Flex sensor data (7 sensors)
        flexSensors: {
            type: [Number],
            required: true,
            validate: {
                validator: function (arr: number[]) {
                    return arr && arr.length === 7;
                },
                message: 'flexSensors must contain exactly 7 values'
            }
        },
        // Timestamp from device
        timestamp: {
            type: Number, // Unix timestamp from device
            default: Date.now
        }
    },
    predictedLetter: {
        type: String,
        maxlength: 5, // Increased to allow "SPACE"
    },
    confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0
    },
    isFrontendData: {
        type: Boolean,
        default: false
    },
    isTrainingData: {
        type: Boolean,
        default: false
    },
    actualLetter: {
        // For training data - the actual letter being signed
        type: String,
        uppercase: true,
        maxlength: 1,
        match: /^[A-Z]$/
    },
    deviceInfo: {
        deviceId: String,
        firmwareVersion: String,
        batteryLevel: Number
    }
}, {
    timestamps: true
});

// Index for faster queries
gestureDataSchema.index({ user: 1, createdAt: -1 });
gestureDataSchema.index({ isTrainingData: 1 });
gestureDataSchema.index({ predictedLetter: 1 });

export default mongoose.model<IGestureData>('GestureData', gestureDataSchema);
