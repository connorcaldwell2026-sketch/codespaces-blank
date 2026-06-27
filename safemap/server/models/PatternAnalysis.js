import mongoose from 'mongoose';

const PatternAnalysisSchema = new mongoose.Schema({
  regionId: String,
  generatedAt: { type: Date, default: Date.now },
  briefing: mongoose.Schema.Types.Mixed,
  hotspots: [mongoose.Schema.Types.Mixed],
  recommendations: [String]
});

export default mongoose.model('PatternAnalysis', PatternAnalysisSchema);
