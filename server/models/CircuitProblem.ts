import mongoose, { Document, Schema } from 'mongoose';

interface CircuitProblemDocument extends Document {
  title: string;
  description: string;
  department: string; // ee | ec | ece | electronics...
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const circuitProblemSchema = new Schema<CircuitProblemDocument>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  department: { type: String, required: true, lowercase: true, trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model<CircuitProblemDocument>('CircuitProblem', circuitProblemSchema);


