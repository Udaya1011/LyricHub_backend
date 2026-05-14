const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Get total unread count for current user
router.get('/unread/total', auth, async (req, res) => {
    try {
        const count = await Message.countDocuments({
            receiver: req.user,
            read: false
        });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get messages between two users
router.get('/:userId', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.user }
            ]
        }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Send a message
router.post('/', auth, async (req, res) => {
    try {
        const { receiver, text } = req.body;
        const newMessage = new Message({
            sender: req.user,
            receiver,
            text
        });
        await newMessage.save();
        res.json(newMessage);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all conversations for the current user
router.get('/conversations/list', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [{ sender: req.user }, { receiver: req.user }]
        }).sort({ createdAt: -1 });

        const conversations = [];
        const userIds = new Set();

        for (const msg of messages) {
            const otherUser = msg.sender.toString() === req.user.toString() ? msg.receiver : msg.sender;
            if (!userIds.has(otherUser.toString())) {
                userIds.add(otherUser.toString());
                conversations.push({
                    userId: otherUser,
                    lastMessage: msg.text,
                    createdAt: msg.createdAt,
                    unreadCount: 0 // Placeholder
                });
            }
        }
        
        // We need to populate the user details for these conversations and count unreads
        const User = require('../models/User');
        const populatedConversations = await Promise.all(conversations.map(async (conv) => {
            const userData = await User.findById(conv.userId).select('name profilePic lastActive');
            const unreadCount = await Message.countDocuments({
                sender: conv.userId,
                receiver: req.user,
                read: false
            });
            return {
                ...conv,
                userName: userData?.name,
                userPic: userData?.profilePic,
                lastActive: userData?.lastActive,
                unreadCount
            };
        }));

        res.json(populatedConversations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark messages as read
router.put('/read/:userId', auth, async (req, res) => {
    try {
        await Message.updateMany(
            { sender: req.params.userId, receiver: req.user, read: false },
            { $set: { read: true } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
