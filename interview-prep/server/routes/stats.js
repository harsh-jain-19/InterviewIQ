import { Router } from 'express';
import mongoose from 'mongoose';
import Session from '../models/Session.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/progress', protect, async (req, res, next) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user._id);
    const [timeline, byRole] = await Promise.all([
      Session.find({ user: uid, status: 'completed' })
        .sort({ completedAt: 1 }).limit(30).select('role overallScore completedAt'),
      Session.aggregate([
        { $match: { user: uid, status: 'completed' } },
        { $group: { _id: '$role', avg: { $avg: '$overallScore' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);
    const best = timeline.reduce((m, s) => Math.max(m, s.overallScore), 0);
    res.json({
      user: req.user,
      best,
      timeline: timeline.map((s) => ({ id: s._id, role: s.role, score: s.overallScore, date: s.completedAt })),
      byRole: byRole.map((r) => ({ role: r._id, avg: Math.round(r.avg), count: r.count })),
    });
  } catch (e) { next(e); }
});

router.get('/leaderboard', protect, async (req, res, next) => {
  try {
    const top = await User.find({ interviewsCompleted: { $gt: 0 } })
      .sort({ xp: -1 }).limit(20)
      .select('name xp interviewsCompleted scoreSum');
    const me = req.user;
    const rank = (await User.countDocuments({ xp: { $gt: me.xp } })) + 1;
    res.json({
      top: top.map((u, i) => ({
        rank: i + 1, id: u._id, name: u.name, xp: u.xp,
        interviews: u.interviewsCompleted, avgScore: u.toJSON().avgScore,
      })),
      me: { rank, xp: me.xp, interviews: me.interviewsCompleted },
    });
  } catch (e) { next(e); }
});

export default router;
