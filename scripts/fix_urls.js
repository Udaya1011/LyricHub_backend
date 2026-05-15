const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Post = require('../models/Post');

dotenv.config({ path: '../.env' });

const LOCAL_IP = '10.170.198.119:5000';
const RENDER_URL = 'lyrichub-backend-1.onrender.com';

async function fixUrls() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for URL migration...');

        // 1. Fix User Profile Pictures
        const users = await User.find({ profilePic: { $regex: LOCAL_IP } });
        console.log(`Found ${users.length} users with local IP URLs.`);
        
        for (let user of users) {
            const oldUrl = user.profilePic;
            user.profilePic = oldUrl.replace(`http://${LOCAL_IP}`, `https://${RENDER_URL}`);
            await user.save();
            console.log(`Updated user ${user.name}: ${user.profilePic}`);
        }

        // 2. Fix Post Images
        const posts = await Post.find({ imageUrl: { $regex: LOCAL_IP } });
        console.log(`Found ${posts.length} posts with local IP URLs.`);
        
        for (let post of posts) {
            const oldUrl = post.imageUrl;
            post.imageUrl = oldUrl.replace(`http://${LOCAL_IP}`, `https://${RENDER_URL}`);
            await post.save();
            console.log(`Updated post ${post.title}: ${post.imageUrl}`);
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

fixUrls();
