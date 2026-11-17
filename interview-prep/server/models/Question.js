import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    role: { type: String, required: true, index: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    category: { type: String, default: 'technical' },
    idealPoints: [String],
    source: { type: String, enum: ['seed', 'ai', 'user'], default: 'user' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

questionSchema.index({ text: 1, role: 1 }, { unique: true });

export default mongoose.model('Question', questionSchema);
