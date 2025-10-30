import mongoose, { Document, Schema } from 'mongoose';

interface CircuitSubmissionDocument extends Document {
  problem: Schema.Types.ObjectId;
  student: Schema.Types.ObjectId;
  department: string;
  design: any; // JSON representing the circuit
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const circuitSubmissionSchema = new Schema<CircuitSubmissionDocument>({
  problem: { type: Schema.Types.ObjectId, ref: 'CircuitProblem', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: String, required: true, lowercase: true, trim: true },
  design: { type: Schema.Types.Mixed, required: true },
  notes: { type: String },
}, { timestamps: true });

export default mongoose.model<CircuitSubmissionDocument>('CircuitSubmission', circuitSubmissionSchema);


