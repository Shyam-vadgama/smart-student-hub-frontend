import mongoose, { Document, Schema } from 'mongoose';

interface IBadge extends Document {
  user: mongoose.Types.ObjectId;
  level: string;
  points: number;
  currentStreak: number;
  maxStreak: number;
  lastSolvedAt?: Date;
}

const badgeSchema = new Schema<IBadge>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  level: {
    type: String,
    required: true,
    default: "Beginner",
  },
  points: {
    type: Number,
    required: true,
    default: 0,
  },
  currentStreak: {
    type: Number,
    required: true,
    default: 0,
  },
  maxStreak: {
    type: Number,
    required: true,
    default: 0,
  },
  lastSolvedAt: {
    type: Date,
  },
}, {
  timestamps: true
});

export const BadgeModel = mongoose.model<IBadge>('Badge', badgeSchema);
export { IBadge };
