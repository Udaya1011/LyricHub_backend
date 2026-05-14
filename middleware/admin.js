const User = require('../models/User');

const admin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = admin;
