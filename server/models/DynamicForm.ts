import mongoose, { Document, Schema } from 'mongoose';
import { DynamicForm } from '@shared/schema';

export interface DynamicFormDocument extends Omit<DynamicForm, '_id'>, Document {}

const dynamicFormSchema = new Schema<DynamicFormDocument>({
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  fields: [{
    label: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: ['text', 'email', 'number', 'date', 'select', 'textarea', 'file']
    },
    required: {
      type: Boolean,
      default: false
    },
    options: [{
      type: String,
      trim: true
    }]
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  submissions: [{
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    data: {
      type: Schema.Types.Mixed,
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

dynamicFormSchema.index({ createdBy: 1 });
dynamicFormSchema.index({ status: 1 });

export default mongoose.model<DynamicFormDocument>('DynamicForm', dynamicFormSchema);
