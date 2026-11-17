import { Router } from 'express';
import User from '../models/User.js';
import { protect, signToken } from '../middleware/auth.js';

const router = Router();
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !emailRe.test(email || '') || (password || '').length < 6)
      return res.status(400).json({ message: 'Enter a name, a valid email and a password of 6+ characters' });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ message: 'An account with this email already exists' });
    const user = await User.create({ name, email, password });
    user.password = undefined;
    res.status(201).json({ token: signToken(user._id), user });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password || '')))
      return res.status(401).json({ message: 'Incorrect email or password' });
    user.password = undefined;
    res.json({ token: signToken(user._id), user });
  } catch (e) { next(e); }
});

router.get('/me', protect, (req, res) => res.json({ user: req.user }));

export default router;
