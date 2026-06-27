import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  userId: String,
  text: String,
  flagged: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  verifiedUser: { type: Boolean, default: false }
});

export default mongoose.model('Comment', CommentSchema);
