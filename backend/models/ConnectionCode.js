const mongoose = require('mongoose');

const connectionCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } } // TTL index for 1 hour expiration
}, { timestamps: true });

module.exports = mongoose.model('ConnectionCode', connectionCodeSchema);
