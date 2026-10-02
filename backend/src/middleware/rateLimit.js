const rateLimit = require('express-rate-limit');

const make = (windowMs, limit, message) =>
  rateLimit({ windowMs, limit, standardHeaders: true, legacyHeaders: false, message: { error: message } });

module.exports = {
  global: make(60_000, 120, 'Too many requests'),
  login: make(15 * 60_000, 10, 'Too many login attempts'),
  aiGenerate: make(60 * 60_000, 20, 'AI generation limit reached (20/hour)'),
  contact: make(60 * 60_000, 5, 'Too many messages, try later'),
};
