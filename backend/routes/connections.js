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
    const code = crypto.randomInt(100000000000, 999999999999).toString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await ConnectionCode.deleteMany({ user: req.user._id }); // Invalidate old codes
    
    const connectionCode = new ConnectionCode({ code, user: req.user._id, expiresAt });
    await connectionCode.save();

    res.json({ code, expiresAt });
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

    if (connectionCode.user.toString() === req.user._id) {
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
