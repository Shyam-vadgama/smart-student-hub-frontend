import { Schema, model, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  college: Schema.Types.ObjectId;
  hod: Schema.Types.ObjectId;
}

const DepartmentSchema = new Schema({
  name: { type: String, required: true },
  college: { type: Schema.Types.ObjectId, ref: 'College' },
  hod: { type: Schema.Types.ObjectId, ref: 'User' },
});

export default model<IDepartment>('Department', DepartmentSchema);
