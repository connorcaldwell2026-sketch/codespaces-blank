import mongoose from 'mongoose';

const WantedSchema = new mongoose.Schema({
  source: String,
  sourceId: { type: String, index: true },
  name: String,
  aliases: [String],
  description: String,
  imageUrl: String,
  reward: String,
  caution: String,
  nationality: String,
  gender: String,
  lastKnownLocation: String,
  sourceUrl: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('WantedPerson', WantedSchema);
