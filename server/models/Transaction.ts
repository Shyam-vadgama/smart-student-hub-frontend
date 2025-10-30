import mongoose, { Schema, Document } from 'mongoose';

interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;
  ticker: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  date: Date;
}

const TransactionSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ticker: { type: String, required: true, uppercase: true },
  type: { type: String, enum: ['buy', 'sell'], required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);