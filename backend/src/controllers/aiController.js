const slugify = require('slugify');
const crypto = require('crypto');
const { z } = require('zod');
const Project = require('../models/Project');
const Image = require('../models/Image');
const env = require('../config/env');
const logger = require('../config/logger');
const { generateProjectJson, generateImageBuffer } = require('../services/aiService');

const bodySchema = z.object({
  idea: z.string().trim().min(20, 'Describe the project in at least 20 characters.').max(2000),
  githubUrl: z.string().url().optional().or(z.literal('')),
  liveUrl: z.string().url().optional().or(z.literal('')),
  publish: z.boolean().default(true),
});

async function uniqueSlug(title) {
  const base = slugify(title, { lower: true, strict: true }).slice(0, 80) || 'project';
  if (!(await Project.exists({ slug: base }))) return base;
  return `${base}-${crypto.randomBytes(3).toString('hex')}`;
}

/** POST /api/admin/ai/generate  (JWT protected) */
exports.generateAndPublish = async (req, res, next) => {
  const started = Date.now();
  try {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    const { idea, githubUrl = '', liveUrl = '', publish } = parsed.data;

    // 1. LLM -> validated JSON
    const content = await generateProjectJson(idea);

    // 2. Image (non-fatal). Skipped entirely when IMAGE_PROVIDER=none.
    let imageDoc = null;
    let imageStatus = 'none';
    if (env.IMAGE_PROVIDER === 'openai') {
      imageStatus = 'failed';
      try {
        const buf = await generateImageBuffer(content.imagePrompt);
        imageDoc = await Image.create({ data: buf, contentType: 'image/png' });
        imageStatus = 'ok';
      } catch (imgErr) {
        logger.error({ event: 'image_generation_failed', code: imgErr.code, msg: imgErr.message });
      }
    }

    // 3. Persist. Retry once on slug race.
    let project;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        project = await Project.create({
          title: content.title,
          slug: await uniqueSlug(content.title),
          description: content.description,
          writeup: content.writeup,
          tags: [...new Set(content.tags.map((t) => t.trim()))],
          imagePrompt: content.imagePrompt,
          thumbnailId: imageDoc?._id,
          thumbnailUrl: imageDoc ? `/api/images/${imageDoc._id}` : '',
          imageStatus,
          githubUrl,
          liveUrl,
          sourceIdea: idea,
          published: publish,
          createdBy: req.admin.id,
        });
        break;
      } catch (dbErr) {
        if (dbErr.code === 11000 && attempt === 1) continue;
        if (imageDoc) await Image.deleteOne({ _id: imageDoc._id }).catch(() => {});
        throw dbErr;
      }
    }

    logger.info({ event: 'project_generated', id: project._id, imageStatus, ms: Date.now() - started });
    return res.status(201).json({ project, imageStatus });
  } catch (err) {
    next(err);
  }
};
