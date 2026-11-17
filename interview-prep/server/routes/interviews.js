import { Router } from 'express';
import Session from '../models/Session.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { generateQuestions, evaluateAnswer, summarizeSession } from '../services/llm.js';

const router = Router();
router.use(protect);

const DIFFS = ['easy', 'medium', 'hard'];
const TYPES = ['technical', 'behavioral', 'mixed'];
const XP_PER_POINT = { easy: 0.5, medium: 0.75, hard: 1 };

router.post('/start', async (req, res, next) => {
  try {
    const role = String(req.body.role || '').trim().slice(0, 80);
    const difficulty = DIFFS.includes(req.body.difficulty) ? req.body.difficulty : 'medium';
    const type = TYPES.includes(req.body.type) ? req.body.type : 'mixed';
    const count = Math.min(Math.max(parseInt(req.body.count) || 5, 3), 10);
    if (!role) return res.status(400).json({ message: 'Choose or type a role to practise for' });

    const questions = await generateQuestions({ role, difficulty, count, type });
    if (!questions.length)
      return res.status(503).json({ message: 'No questions available yet. Run the seed script or add an API key.' });

    const session = await Session.create({ user: req.user._id, role, difficulty, type, questions });
    res.status(201).json(stripIdeal(session));
  } catch (e) { next(e); }
});

router.post('/:id/answer', async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ message: 'Interview not found' });
    if (session.status === 'completed')
      return res.status(400).json({ message: 'This interview is already finished' });

    const { index, answer, inputMode } = req.body;
    const q = session.questions[index];
    if (!q) return res.status(400).json({ message: 'Invalid question number' });
    if (q.score !== null) return res.status(400).json({ message: 'You already answered this question' });

    const text = String(answer || '').trim().slice(0, 4000);
    const result = await evaluateAnswer({
      role: session.role, difficulty: session.difficulty,
      question: q.text, answer: text, idealPoints: q.idealPoints, inputMode,
    });

    Object.assign(q, { answer: text, inputMode: inputMode === 'voice' ? 'voice' : 'text', ...result });
    await session.save();
    res.json({ index, ...result });
  } catch (e) { next(e); }
});

router.post('/:id/finish', async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ message: 'Interview not found' });
    if (session.status === 'completed') return res.json(session);

    // Unanswered questions count as 0
    session.questions.forEach((q) => { if (q.score === null) q.score = 0; });
    const overall = Math.round(session.questions.reduce((s, q) => s + q.score, 0) / session.questions.length);
    session.overallScore = overall;
    session.summary = await summarizeSession({ role: session.role, questions: session.questions, overallScore: overall });
    session.xpEarned = Math.round(overall * session.questions.length * XP_PER_POINT[session.difficulty] / 5) + 10;
    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { xp: session.xpEarned, interviewsCompleted: 1, scoreSum: overall },
    });
    res.json(session);
  } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try {
    const items = await Session.find({ user: req.user._id, status: 'completed' })
      .select('role difficulty type overallScore xpEarned completedAt questions.score')
      .sort({ completedAt: -1 }).limit(50);
    res.json(items);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ message: 'Interview not found' });
    res.json(session.status === 'completed' ? session : stripIdeal(session));
  } catch (e) { next(e); }
});

// Don't leak model answers / scoring hints before a question is answered
function stripIdeal(session) {
  const obj = session.toObject();
  obj.questions = obj.questions.map((q) =>
    q.score === null ? { text: q.text, category: q.category, score: null } : q
  );
  return obj;
}

export default router;
