const jwt = require('jsonwebtoken');
const { z } = require('zod');
const Admin = require('../models/Admin');
const env = require('../config/env');

const schema = z.object({ username: z.string().min(1).max(64), password: z.string().min(1).max(128) });
const FAIL = { error: 'Invalid credentials' };

exports.login = async (req, res, next) => {
  try {
    const p = schema.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: 'Invalid input' });

    const admin = await Admin.findOne({ username: p.data.username.toLowerCase() }).select('+passwordHash');
    if (!admin) return res.status(401).json(FAIL);
    if (admin.isLocked) return res.status(423).json({ error: 'Account temporarily locked' });

    if (!(await admin.verifyPassword(p.data.password))) {
      await admin.registerFailure();
      return res.status(401).json(FAIL);
    }
    await admin.registerSuccess();

    const token = jwt.sign({ username: admin.username }, env.JWT_SECRET, {
      subject: String(admin._id),
      expiresIn: env.JWT_EXPIRES_IN,
      algorithm: 'HS256',
    });
    res.json({ token });
  } catch (err) {
    next(err);
  }
};
