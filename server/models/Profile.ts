import mongoose, { Document, Schema } from 'mongoose';
import { Profile } from '@shared/schema';

export interface ProfileDocument extends Omit<Profile, '_id'>, Document {}

const profileSchema = new Schema<ProfileDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  semester: {
    type: Number,
    min: 1,
    max: 8
  },
  course: {
    type: String,
    trim: true
  },
  batch: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

profileSchema.index({ user: 1 });

export default mongoose.model<ProfileDocument>('Profile', profileSchema);
