import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/safemap';

async function run() {
  await mongoose.connect(MONGO_URI);
  const email = process.env.ADMIN_EMAIL || 'corycaldwell98@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'Zoom6969';
  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
    console.log('Admin user updated:', email);
    process.exit(0);
  }
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name: 'Admin', email, role: 'admin', passwordHash: hash, verifiedPhone: true });
  console.log('Admin user created:', email);
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
