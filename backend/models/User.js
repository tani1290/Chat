const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, default: '', unique: true, sparse: true },
  phone: { type: String, default: '', sparse: true },
  passwordHash: { type: String },
  firebaseId: { type: String, sparse: true },   // Firebase UID
  googleId: { type: String, sparse: true },      // legacy
  role: { type: String, enum: ['user', 'influencer', 'corporate'], default: 'user' },
  bio: { type: String, default: '' },
  statusMessage: { type: String, default: '' },
  pronouns: { type: String, default: '' },
  location: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

