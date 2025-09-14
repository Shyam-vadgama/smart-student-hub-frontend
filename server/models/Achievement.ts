import mongoose, { Document, Schema } from 'mongoose';
import { Achievement } from '@shared/schema';

export interface AchievementDocument extends Omit<Achievement, '_id'>, Document {}

const achievementSchema = new Schema<AchievementDocument>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  certificatePath: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  qrCodePath: {
    type: String
  },
  comments: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Add category and type fields
  category: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    trim: true
  },
  // Add media attachments
  media: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    caption: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true
});

achievementSchema.index({ student: 1 });
achievementSchema.index({ status: 1 });
achievementSchema.index({ createdAt: -1 });
// Add indexes for the new fields
achievementSchema.index({ category: 1 });
achievementSchema.index({ type: 1 });
// Add index for media
achievementSchema.index({ 'media.publicId': 1 });

export default mongoose.model<AchievementDocument>('Achievement', achievementSchema);