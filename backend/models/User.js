const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  googleId: { type: String, sparse: true },
  role: { type: String, enum: ['user', 'influencer', 'corporate'], default: 'user' },
  bio: { type: String, default: '' },
  statusMessage: { type: String, default: '' },
  pronouns: { type: String, default: '' },
  location: { type: String, default: '' },
  profilePicture: { type: String, default: '' }, // base64 or URL
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
