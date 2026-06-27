import mongoose from 'mongoose';

const BroadcastSchema = new mongoose.Schema({
  message: String,
  type: { type: String, enum: ['Warning', 'Emergency', 'Info'], default: 'Info' },
  region: String,
  expiresAt: Date,
  createdBy: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Broadcast', BroadcastSchema);
