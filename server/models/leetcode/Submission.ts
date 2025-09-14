import mongoose, { Document, Schema } from 'mongoose';

interface ISubmission extends Document {
  problem: mongoose.Types.ObjectId;
  madeBy: mongoose.Types.ObjectId;
  status: boolean;
  code: string;
  language: string;
}

const submissionSchema = new Schema<ISubmission>({
  problem: {
    type: Schema.Types.ObjectId,
    ref: "Problem"
  },
  madeBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  status: {
    type: Boolean,
    required: true,
    default: false
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export const SubmissionModel = mongoose.model<ISubmission>('Submission', submissionSchema);
export { ISubmission };
