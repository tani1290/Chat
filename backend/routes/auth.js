const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_chat_app_123';

// Initialise Firebase Admin once (idempotent)
if (!admin.apps.length) {
  // Option A: service account JSON via env var (recommended for production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    // Option B: use GOOGLE_APPLICATION_CREDENTIALS env var pointing to JSON file path
    admin.initializeApp();
  }
}

const makeJwt = (user) =>
  jwt.sign({ _id: user._id, username: user.username }, JWT_SECRET);

// Helper: build a safe user response
const userRes = (user, token) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  profilePicture: user.profilePicture,
  token,
});

// ─── Firebase Token Exchange ─────────────────────────────────────────────────
// Called by the frontend after any Firebase sign-in (Google, Email, Phone).
// The frontend sends the Firebase ID token in the Authorization header.
// We verify it with Firebase Admin, then upsert the user in MongoDB and return
// our own application JWT.
router.post('/firebase', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) return res.status(401).json({ error: 'No Firebase token provided' });

    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, phone_number, picture } = decoded;

    // Try to find by firebaseId first, then by email/phone
    let user = await User.findOne({ firebaseId: uid });

    if (!user && email) user = await User.findOne({ email });
    if (!user && phone_number) user = await User.findOne({ phone: phone_number });

    if (!user) {
      // New user — create a profile
      const { username } = req.body; // provided during email/pass registration
      let generatedUsername = username
        || (name ? name.replace(/\s+/g, '_') : null)
        || (email ? email.split('@')[0] : null)
        || `user_${uid.slice(0, 6)}`;

      // Ensure username is unique
      const exists = await User.findOne({ username: generatedUsername });
      if (exists) generatedUsername = `${generatedUsername}_${Math.floor(Math.random() * 9000 + 1000)}`;

      user = new User({
        firebaseId: uid,
        username: generatedUsername,
        email: email || '',
        phone: phone_number || '',
        profilePicture: picture || '',
      });
      await user.save();
    } else {
      // Existing user — update firebase link if needed
      if (!user.firebaseId) {
        user.firebaseId = uid;
        if (picture && !user.profilePicture) user.profilePicture = picture;
        await user.save();
      }
    }

    const token = makeJwt(user);
    res.json(userRes(user, token));
  } catch (err) {
    console.error('Firebase auth error:', err.message);
    res.status(401).json({ error: 'Invalid or expired Firebase token' });
  }
});

// ─── Legacy Email / Password (still used if desired) ──────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) return res.status(400).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    user = new User({ username, email, passwordHash });
    await user.save();

    res.json(userRes(user, makeJwt(user)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    res.json(userRes(user, makeJwt(user)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
