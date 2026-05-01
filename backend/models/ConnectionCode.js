const mongoose = require('mongoose');

const connectionCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  validUntil: { type: Date, default: null, index: { expires: 0 } } // null = never expires
}, { timestamps: true });

module.exports = mongoose.model('ConnectionCode', connectionCodeSchema);
