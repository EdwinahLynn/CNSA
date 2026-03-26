/**
 * Run once to create the initial CNSA_ADMIN user.
 * Usage: node src/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  const exists = await User.findOne({ username: 'admin' });
  if (exists) {
    console.log('Admin user already exists.');
  } else {
    await User.create({ username: 'admin', passwordHash: 'admin123', role: 'CNSA_ADMIN' });
    console.log('Created admin user — username: admin / password: admin123');
    console.log('CHANGE THIS PASSWORD after first login!');
  }
  await mongoose.disconnect();
}

seed().catch(console.error);
