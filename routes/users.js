const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get User Profile
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('followers', 'name profilePic')
            .populate('following', 'name profilePic');
        
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Follow/Unfollow User
router.post('/:id/follow', auth, async (req, res) => {
    try {
        if (req.user === req.params.id) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user);

        if (!userToFollow || !currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isFollowing = currentUser.following.includes(req.params.id);

        if (isFollowing) {
            // Unfollow
            currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id);
            userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== req.user);
        } else {
            // Follow
            currentUser.following.push(req.params.id);
            userToFollow.followers.push(req.user);
        }

        await currentUser.save();
        await userToFollow.save();

        res.json({ 
            message: isFollowing ? 'Unfollowed' : 'Followed',
            followersCount: userToFollow.followers.length,
            followingCount: currentUser.following.length
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
