import { Router } from 'express';
import Question from '../models/Question.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/meta', protect, async (req, res, next) => {
  try {
    res.json({ roles: await Question.distinct('role') });
  } catch (e) { next(e); }
});

router.get('/', protect, async (req, res, next) => {
  try {
    const { role, difficulty, category, q } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const filter = {};
    if (role) filter.role = role;
    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;
    if (q) filter.text = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const [items, total] = await Promise.all([
      Question.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Question.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

router.post('/', protect, async (req, res, next) => {
  try {
    const { text, role, difficulty, category } = req.body;
    if (!text || !role) return res.status(400).json({ message: 'Question text and role are required' });
    const doc = await Question.create({
      text, role, difficulty, category, source: 'user', createdBy: req.user._id,
    });
    res.status(201).json(doc);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'That question already exists for this role' });
    next(e);
  }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ message: 'Question not found' });
    const owner = q.createdBy && q.createdBy.equals(req.user._id);
    if (!owner && req.user.role !== 'admin')
      return res.status(403).json({ message: 'You can only delete your own questions' });
    await q.deleteOne();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
