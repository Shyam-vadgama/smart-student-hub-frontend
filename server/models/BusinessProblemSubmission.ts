import mongoose, { Document, Schema } from 'mongoose';

interface BusinessProblemSubmissionDocument extends Document {
  problem: Schema.Types.ObjectId;
  student: Schema.Types.ObjectId;
  selectedOption: string;
  createdAt: Date;
  updatedAt: Date;
}

const businessProblemSubmissionSchema = new Schema<BusinessProblemSubmissionDocument>({
  problem: { type: Schema.Types.ObjectId, ref: 'BusinessProblem', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  selectedOption: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<BusinessProblemSubmissionDocument>('BusinessProblemSubmission', businessProblemSubmissionSchema);
