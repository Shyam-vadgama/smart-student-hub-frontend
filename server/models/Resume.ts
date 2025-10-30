import mongoose, { Document, Schema } from 'mongoose';

export interface ResumeDocument extends Document {
  user: mongoose.Types.ObjectId;
  template: number;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<ResumeDocument>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  template: { type: Number, enum: [1, 2, 3], required: true },
  data: { type: Schema.Types.Mixed, required: true }
}, { timestamps: true });

export default mongoose.model<ResumeDocument>('Resume', resumeSchema);


