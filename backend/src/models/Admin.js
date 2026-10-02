const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  { timestamps: true }
);

adminSchema.statics.hashPassword = (plain) => bcrypt.hash(plain, 12);

adminSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

adminSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

adminSchema.methods.registerFailure = async function () {
  this.loginAttempts += 1;
  if (this.loginAttempts >= MAX_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_MS);
    this.loginAttempts = 0;
  }
  await this.save();
};

adminSchema.methods.registerSuccess = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

module.exports = mongoose.model('Admin', adminSchema);
