import mongoose from 'mongoose';

const SafetyHistorySchema = new mongoose.Schema({
  weekStart: Date,
  score: Number
}, { _id: false });

const NeighborhoodSchema = new mongoose.Schema({
  name: String,
  polygon: {
    type: { type: String, default: 'Polygon' },
    coordinates: []
  },
  memberIds: [String],
  safetyScore: { type: Number, default: 50 },
  safetyHistory: [SafetyHistorySchema],
  activityScore: { type: Number, default: 0 }
});

NeighborhoodSchema.index({ polygon: '2dsphere' });
export default mongoose.model('Neighborhood', NeighborhoodSchema);
