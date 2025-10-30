import { Schema, model, Document } from 'mongoose';

export interface IMarks extends Document {
  student: Schema.Types.ObjectId;
  subject: Schema.Types.ObjectId;
  marks: number;
  examType: string; // e.g., 'mid-sem', 'final'
}

const MarksSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  marks: { type: Number, required: true },
  examType: { type: String, required: true },
}, {
  timestamps: true
});

export default model<IMarks>('Marks', MarksSchema);
