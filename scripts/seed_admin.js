require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'admin@lyrichub.com';
        const password = 'admin123'; // The password you want

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            existingUser.isAdmin = true;
            const salt = await bcrypt.genSalt(10);
            existingUser.password = await bcrypt.hash(password, salt);
            await existingUser.save();
            console.log(`Admin ${email} updated with password: ${password}`);
        } else {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            
            const adminUser = new User({
                name: 'System Admin',
                email: email,
                password: passwordHash,
                isAdmin: true
            });
            await adminUser.save();
            console.log(`New Admin ${email} created with password: ${password}`);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createAdmin();
