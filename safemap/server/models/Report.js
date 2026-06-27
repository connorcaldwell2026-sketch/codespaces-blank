import mongoose from 'mongoose';

const ReactionSchema = new mongoose.Schema({
  userId: String,
  type: String,
  count: { type: Number, default: 1 }
}, { _id: false });

const InternalNoteSchema = new mongoose.Schema({
  authorId: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const ReportSchema = new mongoose.Schema({
  description: { type: String, required: true },
  crimeType: String,
  suggestedTags: [String],
  severity: { type: Number, default: 1 },
  verified: { type: Boolean, default: false },
  priority: { type: Number, default: 3 },
  status: { type: String, default: 'Incoming' },
  regionId: { type: String, index: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  // more detailed fields
  incidentTime: Date,
  address: String,
  victimCount: { type: Number, default: 0 },
  witnessCount: { type: Number, default: 0 },
  mediaUrls: [String],
  reporterContact: String,
  reporterConfidence: { type: Number, min: 0, max: 100, default: 80 },
  source: { type: String, enum: ['user', 'agency', 'import', 'other'], default: 'user' },
  additionalDetails: String,
  witnessToken: String,
  assignedTo: String,
  assignedAt: Date,
  isEmergency: { type: Boolean, default: false },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  reactions: [ReactionSchema],
  internalNotes: [InternalNoteSchema],
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date,
  imageDescription: String
});

ReportSchema.index({ location: '2dsphere' });
export default mongoose.model('Report', ReportSchema);
