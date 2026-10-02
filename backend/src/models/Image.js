const mongoose = require('mongoose');

// Stored in Mongo because provider URLs expire and Render's disk is ephemeral.
const imageSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, default: 'image/png' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Image', imageSchema);
