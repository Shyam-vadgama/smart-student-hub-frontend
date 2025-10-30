import { Schema, model, Document } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  faculty: Schema.Types.ObjectId;
  classroom: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
}

const SubjectSchema = new Schema({
  name: { type: String, required: true },
  faculty: { type: Schema.Types.ObjectId, ref: 'User' },
  classroom: { type: Schema.Types.ObjectId, ref: 'Classroom' },
  department: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

export default model<ISubject>('Subject', SubjectSchema);
