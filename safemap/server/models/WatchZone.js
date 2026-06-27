import mongoose from 'mongoose';

const WatchZoneSchema = new mongoose.Schema({
  userId: String,
  regionId: { type: String, index: true },
  name: String,
  label: String,
  center: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  radiusKm: Number,
  polygon: {
    type: { type: String, default: 'Polygon' },
    coordinates: [[[Number]]]
  },
  alertTypes: [String],
  crimeTypeFilters: [String],
  minSeverity: { type: Number, default: 1 },
  description: String,
  quietHours: {
    start: { type: Number, default: 23 },
    end: { type: Number, default: 7 }
  },
  startAt: Date,
  endAt: Date,
  createdAt: { type: Date, default: Date.now }
});

WatchZoneSchema.index({ center: '2dsphere' });
export default mongoose.model('WatchZone', WatchZoneSchema);
