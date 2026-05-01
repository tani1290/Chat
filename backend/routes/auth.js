const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy_client_id_for_now');

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) return res.status(400).json({ error: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    user = new User({ username, email, passwordHash });
    await user.save();

    const token = jwt.sign({ _id: user._id, username: user.username }, process.env.JWT_SECRET || 'supersecretkey_chat_app_123');
    res.json({ _id: user._id, username: user.username, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ _id: user._id, username: user.username }, process.env.JWT_SECRET || 'supersecretkey_chat_app_123');
    res.json({ _id: user._id, username: user.username, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id_for_now',
    });
    const payload = ticket.getPayload();
    const { email, name, sub, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        username: name.replace(/\s+/g, '_') + Math.floor(Math.random() * 1000),
        email,
        googleId: sub,
        profilePicture: picture
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = sub;
      if (!user.profilePicture) user.profilePicture = picture;
      await user.save();
    }

    const jwtToken = jwt.sign({ _id: user._id, username: user.username }, process.env.JWT_SECRET || 'supersecretkey_chat_app_123');
    res.json({ _id: user._id, username: user.username, token: jwtToken, role: user.role, profilePicture: user.profilePicture });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
