import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISession extends Document {
    user: Types.ObjectId;
    deviceId: string; // Hardware UUID reference
    language: 'ar' | 'en';
    startTime: Date;
    endTime?: Date;
    status: 'active' | 'completed' | 'cancelled';
    metrics?: {
        totalLetters?: number;
        accuracy?: number;
    };
}

const sessionSchema = new Schema<ISession>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deviceId: {
        type: String,
        required: [true, 'Device ID is required to start a session'],
        trim: true
    },
    language: {
        type: String,
        enum: ['ar', 'en'],
        default: 'ar'
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    metrics: {
        totalLetters: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Index for user sessions and active sessions
sessionSchema.index({ user: 1, startTime: -1 });
sessionSchema.index({ status: 1 });

export default mongoose.model<ISession>('Session', sessionSchema);
