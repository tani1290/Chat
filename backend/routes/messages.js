const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const auth = require('../middleware/auth');

// Get messages for a conversation
router.get('/:conversationId', auth, async (req, res) => {
  try {
    // Validate user is part of conversation
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate('senderId', 'username email')
      .sort({ createdAt: 1 }); // Oldest to newest
      
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
