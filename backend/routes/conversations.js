const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const auth = require('../middleware/auth');

// Get all conversations for a user
router.get('/', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
    .populate('participants', 'username email isOnline lastSeen')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });
    
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new one-to-one conversation or get existing
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId } = req.body;
    
    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, receiverId], $size: 2 }
    }).populate('participants', 'username email isOnline lastSeen');
    
    if (conversation) {
      return res.json(conversation);
    }
    
    // Create new
    conversation = new Conversation({
      participants: [req.user._id, receiverId],
      isGroup: false
    });
    
    await conversation.save();
    conversation = await conversation.populate('participants', 'username email isOnline lastSeen');
    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a group conversation
router.post('/group', auth, async (req, res) => {
  try {
    const { name, participantIds } = req.body;
    if (participantIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 other participants required' });
    }
    
    let participants = [...participantIds, req.user._id];
    
    const conversation = new Conversation({
      isGroup: true,
      name,
      participants
    });
    
    await conversation.save();
    await conversation.populate('participants', 'username email isOnline lastSeen');
    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
