const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please enter all fields' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: passwordHash
        });

        const savedUser = await newUser.save();
        
        // Notify all admins about new user
        const admins = await User.find({ isAdmin: true });
        if (admins.length > 0) {
            const adminNotifications = admins.map(admin => ({
                recipient: admin._id,
                sender: savedUser._id,
                type: 'new_user'
            }));
            const Notification = require('../models/Notification');
            await Notification.insertMany(adminNotifications);
        }

        const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET);
        
        res.json({
            token,
            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter all fields' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePic: user.profilePic,
                bio: user.bio,
                isAdmin: user.isAdmin
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Profile
const auth = require('../middleware/auth');
router.put('/update', auth, async (req, res) => {
    try {
        const { name, bio, profilePic } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.user,
            { name, bio, profilePic },
            { new: true }
        ).select('-password');
        
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Change Password
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user);
        
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload Profile Picture
const upload = require('../config/cloudinary');
router.post('/upload-image', auth, upload.single('image'), async (req, res) => {
    try {
        console.log('Upload Request Received');
        if (!req.file) {
            console.log('No file in request');
            return res.status(400).json({ message: 'No file uploaded' });
        }
        console.log('File received:', req.file.originalname);
        
        let imageUrl = req.file.path;
        // If it's local storage, make it an absolute URL
        if (!imageUrl.startsWith('http')) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            imageUrl = `${baseUrl}/${imageUrl.replace(/\\/g, '/')}`;
        }
        
        res.json({ imageUrl });
    } catch (err) {
        console.error('Cloudinary Upload Error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
});

// Get Current User
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user).select('-password')
            .populate('followers', 'name profilePic')
            .populate('following', 'name profilePic');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/heartbeat', auth, (req, res) => {
    res.json({ success: true });
});

module.exports = router;
