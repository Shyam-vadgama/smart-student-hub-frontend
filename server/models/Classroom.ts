import { Schema, model, Document } from 'mongoose';

export interface IClassroom extends Document {
  name: string;
  department: Schema.Types.ObjectId;
  subjects: Schema.Types.ObjectId[];
}

const ClassroomSchema = new Schema({ 
  name: { type: String, required: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
});

export default model<IClassroom>('Classroom', ClassroomSchema);
