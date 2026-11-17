import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    category: String,
    idealPoints: [String],
    answer: { type: String, default: '' },
    inputMode: { type: String, enum: ['text', 'voice'], default: 'text' },
    score: { type: Number, default: null },
    strengths: [String],
    improvements: [String],
    idealAnswer: String,
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, required: true },
    difficulty: { type: String, default: 'medium' },
    type: { type: String, default: 'mixed' },
    questions: [answerSchema],
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
    overallScore: { type: Number, default: 0 },
    summary: String,
    xpEarned: { type: Number, default: 0 },
    completedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Session', sessionSchema);
