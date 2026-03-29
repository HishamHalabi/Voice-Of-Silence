import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IChat extends Document {
    sender: Types.ObjectId;
    receiver: Types.ObjectId;
    messageType: 'text' | 'voice';
    message?: string;
    audioPath?: string;
    audioDuration: number;
    isRead: boolean;
    readAt?: Date;
    isDeleted: boolean;
    isGloveInput: boolean;
    createdAt: Date;
    updatedAt: Date;
    markAsRead(): Promise<IChat>;
}

const chatSchema = new Schema<IChat>({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Sender is required']
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Receiver is required']
    },
    messageType: {
        type: String,
        enum: ['text', 'voice'],
        default: 'text',
        required: true
    },
    message: {
        type: String,
        required: function (this: IChat) {
            return this.messageType === 'text';
        },
        maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    audioPath: {
        type: String,
        required: function (this: IChat) {
            return this.messageType === 'voice';
        }
    },
    audioDuration: {
        type: Number, // Duration in seconds
        default: 0
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isGloveInput: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for faster queries
chatSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
chatSchema.index({ receiver: 1, isRead: 1 });

// Method to mark message as read
chatSchema.methods.markAsRead = function (this: IChat) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
};

export default mongoose.model<IChat>('Chat', chatSchema);
