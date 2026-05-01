const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const ConnectionCode = require('../models/ConnectionCode');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Generate a 12-digit connection code
router.post('/generate', auth, async (req, res) => {
  try {
    const { expiresIn } = req.body; // minutes: 15, 60, 1440, or null for never
    const code = crypto.randomInt(100000000000, 999999999999).toString();

    let validUntil = null;
    if (expiresIn && parseInt(expiresIn) > 0) {
      validUntil = new Date(Date.now() + parseInt(expiresIn) * 60 * 1000);
    }

    await ConnectionCode.deleteMany({ user: req.user._id }); // Invalidate old codes

    const connectionCode = new ConnectionCode({ code, user: req.user._id, validUntil });
    await connectionCode.save();

    res.json({ code, validUntil });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit a connection code to establish a conversation
router.post('/connect', auth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || code.length !== 12) return res.status(400).json({ error: 'Invalid 12-digit code' });

    const connectionCode = await ConnectionCode.findOne({ code });
    if (!connectionCode) return res.status(404).json({ error: 'Code not found or expired' });

    // Manual expiry check for codes with a validUntil date
    if (connectionCode.validUntil && new Date() > connectionCode.validUntil) {
      await ConnectionCode.deleteOne({ _id: connectionCode._id });
      return res.status(410).json({ error: 'Code has expired' });
    }

    if (connectionCode.user.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot connect with yourself' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, connectionCode.user] }
    });

    if (!conversation) {
      conversation = new Conversation({
        isGroup: false,
        participants: [req.user._id, connectionCode.user]
      });
      await conversation.save();
    }

    // Revoke the code after successful use
    await ConnectionCode.deleteOne({ _id: connectionCode._id });

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
