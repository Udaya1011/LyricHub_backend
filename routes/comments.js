const router = require('express').Router();
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

// Add Comment
router.post('/:postId', auth, async (req, res) => {
    try {
        const { text } = req.body;
        const newComment = new Comment({
            postId: req.params.postId,
            userId: req.user,
            text
        });

        const savedComment = await newComment.save();
        res.json(savedComment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Comments for a Post
router.get('/:postId', async (req, res) => {
    try {
        const comments = await Comment.find({ postId: req.params.postId })
            .populate('userId', 'name profilePic')
            .sort({ createdAt: -1 });
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
