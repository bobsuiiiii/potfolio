require('../config/env');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

(async () => {
  const [username, password] = process.argv.slice(2);
  if (!username || !password || password.length < 12) {
    console.error('usage: npm run seed -- <username> <password (12+ chars)>');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  await Admin.findOneAndUpdate(
    { username: username.toLowerCase() },
    { username: username.toLowerCase(), passwordHash: await Admin.hashPassword(password) },
    { upsert: true }
  );
  console.log('admin ready:', username);
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
