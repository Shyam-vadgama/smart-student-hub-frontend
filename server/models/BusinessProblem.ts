import mongoose, { Document, Schema } from 'mongoose';

interface BusinessProblemDocument extends Document {
  title: string;
  description: string;
  department: string;
  options: string[];
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const businessProblemSchema = new Schema<BusinessProblemDocument>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  department: { type: String, required: true, lowercase: true, trim: true },
  options: [{ type: String }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model<BusinessProblemDocument>('BusinessProblem', businessProblemSchema);
