import mongoose, { Document, Schema } from 'mongoose';

interface QuizQuestion {
  text: string;
  options: string[];
  correctIndex: number;
}

export interface QuizDocument extends Document {
  title: string;
  description?: string;
  department: string; // 'me' etc
  createdBy: Schema.Types.ObjectId;
  questions: QuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<QuizQuestion>({
  text: { type: String, required: true },
  options: { type: [String], required: true, validate: (v: string[]) => v.length >= 2 },
  correctIndex: { type: Number, required: true }
}, { _id: false });

const quizSchema = new Schema<QuizDocument>({
  title: { type: String, required: true },
  description: { type: String },
  department: { type: String, required: true, lowercase: true, trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  questions: { type: [questionSchema], required: true }
}, { timestamps: true });

export default mongoose.model<QuizDocument>('Quiz', quizSchema);


