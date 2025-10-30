import { Schema, model, Document } from 'mongoose';

export interface IAttendance extends Document {
  student: Schema.Types.ObjectId;
  subject: Schema.Types.ObjectId;
  date: Date;
  status: 'present' | 'absent';
}

const AttendanceSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent'], required: true },
}, {
  timestamps: true
});

export default model<IAttendance>('Attendance', AttendanceSchema);
