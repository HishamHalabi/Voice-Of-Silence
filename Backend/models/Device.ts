import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDevice extends Document {
    user: Types.ObjectId;
    deviceId: string; // Hardware UUID/MAC
    name: string;
    connectionType: 'BLE' | 'WIFI';
    firmwareVersion?: string;
    batteryLevel: number;
    lastConnected: Date;
    isActive: boolean;
}

const deviceSchema = new Schema<IDevice>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deviceId: {
        type: String,
        required: [true, 'Hardware Device ID is required'],
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Device name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [80, 'Name cannot exceed 80 characters']
    },
    connectionType: {
        type: String,
        enum: ['BLE', 'WIFI'],
        default: 'BLE'
    },
    firmwareVersion: {
        type: String,
        trim: true
    },
    batteryLevel: {
        type: Number,
        min: 0,
        max: 100,
        default: 100
    },
    lastConnected: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for user's devices
deviceSchema.index({ user: 1, deviceId: 1 });

export default mongoose.model<IDevice>('Device', deviceSchema);
