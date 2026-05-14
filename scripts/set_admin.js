require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const makeAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Replace with the email the user wants to be admin
        const email = 'admin@lyrichub.com'; 
        const user = await User.findOne({ email });

        if (user) {
            user.isAdmin = true;
            await user.save();
            console.log(`User ${email} is now an admin!`);
        } else {
            console.log(`User ${email} not found. Please register first with this email.`);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

makeAdmin();
