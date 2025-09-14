import mongoose, { Document, Schema } from 'mongoose';

export interface FollowDocument extends Document {
  follower: mongoose.Types.ObjectId; // The user who is following
  following: mongoose.Types.ObjectId; // The user being followed
  createdAt: Date;
}

const followSchema = new Schema<FollowDocument>({
  follower: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure a user can't follow the same user multiple times
followSchema.index({ follower: 1, following: 1 }, { unique: true });

export default mongoose.model<FollowDocument>('Follow', followSchema);