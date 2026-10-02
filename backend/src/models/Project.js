const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 200 },
    writeup: { type: String, required: true },
    tags: { type: [String], default: [], index: true },
    imagePrompt: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    thumbnailId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
    imageStatus: { type: String, enum: ['ok', 'failed', 'none'], default: 'none' },
    githubUrl: { type: String, default: '' },
    liveUrl: { type: String, default: '' },
    sourceIdea: { type: String, default: '' },
    published: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

projectSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Project', projectSchema);
