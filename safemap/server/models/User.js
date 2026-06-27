import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  passwordHash: String,
  role: { type: String, enum: ['citizen', 'police', 'admin'], default: 'citizen' },
  verifiedPhone: { type: Boolean, default: false },
  precinct: String,
  regionId: String,
  createdAt: { type: Date, default: Date.now },
  watchPreferences: {
    crimeTypes: [String],
    quietHours: {
      start: { type: Number, default: 23 },
      end: { type: Number, default: 7 }
    },
    minSeverity: { type: Number, default: 1 }
  }
});

export default mongoose.model('User', UserSchema);
