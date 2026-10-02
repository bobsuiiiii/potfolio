const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const limits = require('../middleware/rateLimit');
const auth = require('../controllers/authController');
const projects = require('../controllers/projectController');
const ai = require('../controllers/aiController');
const contact = require('../controllers/contactController');

router.get('/projects', projects.listPublic);
router.get('/projects/:slug', projects.getBySlug);
router.get('/images/:id', projects.image);
router.post('/contact', limits.contact, contact.send);

router.post('/admin/login', limits.login, auth.login);
router.post('/admin/ai/generate', requireAuth, limits.aiGenerate, ai.generateAndPublish);
router.delete('/admin/projects/:id', requireAuth, projects.remove);

module.exports = router;
