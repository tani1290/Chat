const express = require('express');
const router = express.Router();
const axios = require('axios');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

const PYTHON_SERVICE = process.env.PYTHON_SERVICE_URL || 'http://python_service:8000';

// ── POSTS CRUD ─────────────────────────────────────────────────────────────

// GET all posts (feed)
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username profilePicture role')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single post
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username profilePicture role');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create post
router.post('/', auth, async (req, res) => {
  try {
    const { content, attachment } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const post = new Post({
      author: req.user._id,
      content,
      attachment: attachment || ''
    });
    await post.save();
    const populated = await post.populate('author', 'username profilePicture role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update post (owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    post.content = req.body.content || post.content;
    post.attachment = req.body.attachment ?? post.attachment;
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE post (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await Post.deleteOne({ _id: post._id });
    await Comment.deleteMany({ post: req.params.id });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── COMMENTS CRUD ──────────────────────────────────────────────────────────

// GET comments for a post
router.get('/:postId/comments', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add comment (run through Python safety engine)
router.post('/:postId/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Comment text is required' });

    // Safety filter via Python service
    try {
      const filterRes = await axios.post(`${PYTHON_SERVICE}/filter`, { text });
      if (filterRes.data.flagged) {
        return res.status(422).json({ error: `Comment blocked: ${filterRes.data.reason}` });
      }
    } catch (filterErr) {
      console.warn('Safety service unreachable, allowing comment:', filterErr.message);
    }

    const comment = new Comment({
      post: req.params.postId,
      author: req.user._id,
      text
    });
    await comment.save();
    const populated = await comment.populate('author', 'username profilePicture');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update comment (owner only)
router.put('/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    comment.text = req.body.text || comment.text;
    await comment.save();
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE comment (owner only)
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await Comment.deleteOne({ _id: comment._id });
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
