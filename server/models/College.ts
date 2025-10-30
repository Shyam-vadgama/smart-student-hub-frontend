import { Schema, model, Document } from 'mongoose';

export interface ICollege extends Document {
  name: string;
  address: string;
  principal: Schema.Types.ObjectId;
}

const CollegeSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  principal: { type: Schema.Types.ObjectId, ref: 'User' },
});

export default model<ICollege>('College', CollegeSchema);
