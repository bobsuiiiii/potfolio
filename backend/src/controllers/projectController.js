const mongoose = require('mongoose');
const Project = require('../models/Project');
const Image = require('../models/Image');

exports.listPublic = async (_req, res, next) => {
  try {
    const projects = await Project.find({ published: true })
      .select('-sourceIdea -imagePrompt -createdBy')
      .sort({ createdAt: -1 })
      .lean();
    res.set('Cache-Control', 'public, max-age=30');
    res.json({ projects });
  } catch (e) { next(e); }
};

exports.getBySlug = async (req, res, next) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug, published: true })
      .select('-sourceIdea -createdBy').lean();
    if (!project) return res.status(404).json({ error: 'Not found' });
    res.json({ project });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Bad id' });
    const doc = await Project.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (doc.thumbnailId) await Image.deleteOne({ _id: doc.thumbnailId });
    res.status(204).end();
  } catch (e) { next(e); }
};

exports.image = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).end();
    const img = await Image.findById(req.params.id).lean();
    if (!img) return res.status(404).end();
    res.set({ 'Content-Type': img.contentType, 'Cache-Control': 'public, max-age=31536000, immutable' });
    res.send(Buffer.from(img.data.buffer ? img.data.buffer : img.data));
  } catch (e) { next(e); }
};
