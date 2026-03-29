import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVideo extends Document {
    title: string;
    description: string;
    category: 'alphabet' | 'words' | 'sentences' | 'advanced' | 'practice';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    videoPath: string;
    thumbnailPath?: string;
    duration: number;
    viewCount: number;
    isPublished: boolean;
    uploadedBy?: Types.ObjectId;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    incrementViews(): Promise<IVideo>;
}

const videoSchema = new Schema<IVideo>({
    title: {
        type: String,
        required: [true, 'Video title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Video description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
        type: String,
        enum: ['alphabet', 'words', 'sentences', 'advanced', 'practice'],
        required: [true, 'Category is required']
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    videoPath: {
        type: String,
        required: [true, 'Video path is required']
    },
    thumbnailPath: {
        type: String
    },
    duration: {
        type: Number, // Duration in seconds
        default: 0
    },
    viewCount: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    tags: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Index for faster queries
videoSchema.index({ category: 1, difficulty: 1, isPublished: 1 });
videoSchema.index({ tags: 1 });

// Method to increment view count
videoSchema.methods.incrementViews = function (this: IVideo) {
    this.viewCount += 1;
    return this.save();
};

export default mongoose.model<IVideo>('Video', videoSchema);
