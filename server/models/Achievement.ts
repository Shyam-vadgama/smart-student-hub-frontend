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
  }]
}, {
  timestamps: true
});

achievementSchema.index({ student: 1 });
achievementSchema.index({ status: 1 });
achievementSchema.index({ createdAt: -1 });

export default mongoose.model<AchievementDocument>('Achievement', achievementSchema);
