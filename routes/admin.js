const router = require('express').Router();
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Get All Users
router.get('/users', auth, admin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete User
router.delete('/users/:id', auth, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        if (user.isAdmin) return res.status(400).json({ message: 'Cannot delete an admin' });

        // Delete user's posts too
        await Post.deleteMany({ userId: req.params.id });
        await User.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'User and their posts deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Posts (for moderation)
router.get('/posts', auth, admin, async (req, res) => {
    try {
        const posts = await Post.find().populate('userId', 'name email').sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Post
router.delete('/posts/:id', auth, admin, async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
