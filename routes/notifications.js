const router = require('express').Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Get Notifications
router.get('/', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user })
            .populate('sender', 'name profilePic')
            .populate('post', 'title')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark as Read
router.put('/read', auth, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user, read: false },
            { $set: { read: true } }
        );
        res.json({ message: 'Notifications marked as read' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
