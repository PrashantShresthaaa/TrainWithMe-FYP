const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/userModel');

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const name = process.env.ADMIN_NAME || 'TrainWithMe Admin';
    const email = process.env.ADMIN_EMAIL || 'admin@trainwithme.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@12345';

    const existing = await User.findOne({ email });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (existing) {
      existing.name = name;
      existing.password = hashedPassword;
      existing.role = 'admin';
      await existing.save();

      console.log(`Admin updated: ${email}`);
    } else {
      await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'admin',
      });

      console.log(`Admin created: ${email}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
