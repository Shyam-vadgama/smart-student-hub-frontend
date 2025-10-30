import mongoose, { Document, Schema } from 'mongoose';

export interface QuizSubmissionDocument extends Document {
  quiz: Schema.Types.ObjectId;
  student: Schema.Types.ObjectId;
  department: string;
  answers: number[]; // selected index per question
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

const quizSubmissionSchema = new Schema<QuizSubmissionDocument>({
  quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: String, required: true, lowercase: true, trim: true },
  answers: { type: [Number], required: true },
  score: { type: Number, required: true }
}, { timestamps: true });

// Ensure a student can submit only once per quiz
quizSubmissionSchema.index({ quiz: 1, student: 1 }, { unique: true });

export default mongoose.model<QuizSubmissionDocument>('QuizSubmission', quizSubmissionSchema);


