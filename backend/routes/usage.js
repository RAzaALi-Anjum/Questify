const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Middleware to check JWT token
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

// GET /usage - get remaining tries and subscription status
router.get('/', authenticateToken, (req, res) => {
  const maxTries = req.user.subscriptionStatus === 'free' ? 5 : Infinity;
  const remaining = req.user.subscriptionStatus === 'free' ? Math.max(0, 5 - req.user.triesUsed) : 'unlimited';
  res.json({
    name: req.user.name,
    email: req.user.email,
    avatar: req.user.avatar,
    subscriptionStatus: req.user.subscriptionStatus,
    triesUsed: req.user.triesUsed,
    remainingTries: remaining,
  });
});

// POST /use-model - count usage, decrement tries, restrict if over limit
router.post('/use-model', authenticateToken, async (req, res) => {
  if (req.user.subscriptionStatus === 'free' && req.user.triesUsed >= 5) {
    return res.status(403).json({ message: 'Usage limit exceeded. Please subscribe.' });
  }
  req.user.triesUsed += 1;
  await req.user.save();
  res.json({ message: 'Usage recorded', triesUsed: req.user.triesUsed });
});

module.exports = router; 