const router = require('express').Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Create Post
router.post('/', auth, async (req, res) => {
    try {
        const { title, lyrics, audioUrl, imageUrl } = req.body;
        
        const newPost = new Post({
            userId: req.user,
            title,
            lyrics,
            audioUrl,
            imageUrl
        });

        const savedPost = await newPost.save();
        
        // Notify followers
        const user = await User.findById(req.user).populate('followers');
        if (user && user.followers) {
            const notifications = user.followers.map(followerId => ({
                recipient: followerId,
                sender: req.user,
                type: 'new_post',
                post: savedPost._id
            }));
            await Notification.insertMany(notifications);
        }

        res.json(savedPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Posts (Feed)
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('userId', 'name profilePic')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Post by ID
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('userId', 'name profilePic')
            .populate('comments.userId', 'name profilePic');
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Like/Unlike Post
router.post('/:id/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const index = post.likes.indexOf(req.user);
        if (index === -1) {
            post.likes.push(req.user);
        } else {
            post.likes.splice(index, 1);
        }

        await post.save();

        // Notify post owner if it's a like
        if (index === -1 && post.userId.toString() !== req.user) {
            await new Notification({
                recipient: post.userId,
                sender: req.user,
                type: 'like',
                post: post._id
            }).save();
        }

        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Comment
router.post('/:id/comment', auth, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: 'Comment text is required' });

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        post.comments.push({
            userId: req.user,
            text,
            createdAt: new Date()
        });

        await post.save();
        
        // Notify post owner
        if (post.userId.toString() !== req.user) {
            await new Notification({
                recipient: post.userId,
                sender: req.user,
                type: 'comment',
                post: post._id
            }).save();
        }
        
        // Return populated post
        const updatedPost = await Post.findById(req.params.id)
            .populate('userId', 'name profilePic')
            .populate('comments.userId', 'name profilePic');
            
        res.json(updatedPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Post
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, lyrics } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) return res.status(404).json({ message: 'Post not found' });
        
        // Check if user is the owner
        if (post.userId.toString() !== req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        post.title = title || post.title;
        post.lyrics = lyrics || post.lyrics;

        const updatedPost = await post.save();
        res.json(updatedPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Post
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Check if user is the owner
        if (post.userId.toString() !== req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        await post.deleteOne();
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
