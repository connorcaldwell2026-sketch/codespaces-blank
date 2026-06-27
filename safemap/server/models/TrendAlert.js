import mongoose from 'mongoose';

const TrendAlertSchema = new mongoose.Schema({
  crimeType: String,
  regionId: String,
  deltaPercent: Number,
  detectedAt: { type: Date, default: Date.now },
  published: { type: Boolean, default: false }
});

export default mongoose.model('TrendAlert', TrendAlertSchema);
