import mongoose, { Schema, Document } from 'mongoose';

interface IPortfolio extends Document {
  user: mongoose.Types.ObjectId;
  virtualBalance: number;
  holdings: {
    ticker: string;
    quantity: number;
    purchasePrice: number;
  }[];
}

const PortfolioSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  virtualBalance: { type: Number, default: 100000 }, // Start with $100,000
  holdings: [{
    ticker: { type: String, required: true, uppercase: true },
    quantity: { type: Number, required: true },
    purchasePrice: { type: Number, required: true }
  }]
}, { timestamps: true });

export default mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);