const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true }, // Not required for email/password users
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String },
  password: { type: String }, // Hashed password for email/password users
  triesUsed: { type: Number, default: 0 },
  subscriptionStatus: { type: String, enum: ['free', 'paid'], default: 'free' },
  apiToken: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema); 