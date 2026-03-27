const express = require('express');
const router  = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const audit   = require('../middleware/audit');

const authC     = require('../controllers/authController');
const refC      = require('../controllers/refugeesController');
const caseC     = require('../controllers/casesController');
const campC     = require('../controllers/campsController');
const distC     = require('../controllers/distributionsController');
const userC     = require('../controllers/usersController');
const dashC     = require('../controllers/dashboardController');
const msgC      = require('../controllers/messagesController');
const finC      = require('../controllers/financingsController');
const courseC   = require('../controllers/coursesController');
const storyC    = require('../controllers/storiesController');
const homeC     = require('../controllers/homepageController');

// ── AUTH ────────────────────────────────────────
router.post('/auth/login',           authC.login);
router.post('/auth/register',        authC.register);
router.post('/auth/verify-email',    authC.verifyEmail);
router.get( '/auth/me',              auth, authC.me);
router.put( '/auth/profile',         auth, authC.updateProfile);
router.put( '/auth/change-password', auth, authC.changePassword);

// ── DASHBOARD ───────────────────────────────────
router.get('/dashboard', auth, dashC.getStats);

// ── USERS ───────────────────────────────────────
router.get(   '/users',                auth, requireRole('admin'), userC.getAll);
router.get(   '/users/pending',        auth, requireRole('admin'), userC.getPendingRegistrations);
router.get(   '/users/:id',            auth, requireRole('admin'), userC.getOne);
router.post(  '/users',                auth, requireRole('admin'), userC.create);
router.put(   '/users/:id',            auth, requireRole('admin'), userC.update);
router.put(   '/users/:id/approve',    auth, requireRole('admin'), userC.approve);
router.put(   '/users/:id/reject',     auth, requireRole('admin'), userC.reject);
router.put(   '/users/:id/suspend',    auth, requireRole('admin'), userC.suspend);
router.put(   '/users/:id/reset-password', auth, requireRole('admin'), userC.resetPassword);
router.delete('/users/:id',            auth, requireRole('admin'), userC.delete);

// ── REFUGEES ────────────────────────────────────
router.get(   '/refugees',       auth, refC.getAll);
router.get(   '/refugees/stats', auth, refC.getStats);
router.get(   '/refugees/:id',   auth, refC.getOne);
router.post(  '/refugees',       auth, audit('CREATE','refugee'), refC.create);
router.put(   '/refugees/:id',   auth, audit('UPDATE','refugee'), refC.update);
router.delete('/refugees/:id',   auth, requireRole('admin'), audit('DELETE','refugee'), refC.delete);

// ── CASES ───────────────────────────────────────
router.get(   '/cases',           auth, caseC.getAll);
router.get(   '/cases/:id',       auth, caseC.getOne);
router.post(  '/cases',           auth, audit('CREATE','case'), caseC.create);
router.put(   '/cases/:id',       auth, audit('UPDATE','case'), caseC.update);
router.delete('/cases/:id',       auth, requireRole('admin'), caseC.delete || ((req,res)=>res.json({success:true})));
router.post(  '/cases/:id/notes', auth, caseC.addNote);

// ── CAMPS ───────────────────────────────────────
router.get(   '/camps',            auth, campC.getAll);
router.get(   '/camps/:id',        auth, campC.getOne);
router.get(   '/camps/:id/inventory', auth, campC.getInventory);
router.post(  '/camps',            auth, requireRole('admin'), campC.create);
router.put(   '/camps/:id',        auth, requireRole('admin'), campC.update);
router.delete('/camps/:id',        auth, requireRole('admin'), (req,res)=>res.json({success:true}));

// ── DISTRIBUTIONS ───────────────────────────────
router.get( '/distributions',         auth, distC.getAll);
router.get( '/distributions/summary', auth, distC.getSummary);
router.post('/distributions',         auth, audit('CREATE','distribution'), distC.create);
router.delete('/distributions/:id',   auth, requireRole('admin'), (req,res)=>res.json({success:true}));

// ── FINANCINGS ──────────────────────────────────
router.get(   '/financings',                auth, finC.getAll);
router.get(   '/financings/summary',        auth, finC.getSummary);
router.get(   '/financings/:id',            auth, finC.getOne);
router.post(  '/financings',                auth, requireRole('admin'), finC.create);
router.put(   '/financings/:id',            auth, requireRole('admin'), finC.update);
router.delete('/financings/:id',            auth, requireRole('admin'), finC.delete);
router.post(  '/financings/:id/allocations',auth, requireRole('admin'), finC.addAllocation);

// ── COURSES ─────────────────────────────────────
router.get(   '/courses',                   auth, courseC.getAll);
router.get(   '/courses/:id',               auth, courseC.getOne);
router.post(  '/courses',                   auth, requireRole('admin','volunteer'), courseC.create);
router.put(   '/courses/:id',               auth, requireRole('admin','volunteer'), courseC.update);
router.delete('/courses/:id',               auth, requireRole('admin'), courseC.delete);
router.post(  '/courses/:id/lessons',       auth, requireRole('admin','volunteer'), courseC.addLesson);
router.put(   '/courses/:id/lessons/:lessonId', auth, requireRole('admin','volunteer'), courseC.updateLesson);
router.delete('/courses/:id/lessons/:lessonId', auth, requireRole('admin'), courseC.deleteLesson);
router.post(  '/courses/:id/enroll',        auth, courseC.enroll);
router.put(   '/courses/:id/progress',      auth, courseC.updateProgress);

// ── STORIES ─────────────────────────────────────
router.get(   '/stories',          storyC.getAll);
router.post(  '/stories',          storyC.create);
router.put(   '/stories/:id',      auth, requireRole('admin'), storyC.update);
router.put(   '/stories/:id/publish', auth, requireRole('admin'), storyC.publish);
router.delete('/stories/:id',      auth, requireRole('admin'), storyC.delete);

// ── MESSAGES ────────────────────────────────────
router.post('/messages/public',       msgC.sendPublic);
router.get( '/messages/inbox',        auth, msgC.inbox);
router.get( '/messages/sent',         auth, msgC.sent);
router.get( '/messages/public-list',  auth, requireRole('admin'), msgC.getPublic);
router.get( '/messages/unread-count', auth, msgC.unreadCount);
router.post('/messages',              auth, msgC.send);
router.post('/messages/:id/reply',    auth, requireRole('admin'), msgC.reply);
router.put( '/messages/:id/read',     auth, msgC.markRead);
router.delete('/messages/:id',        auth, msgC.delete);

// ── HOMEPAGE CONTENT ────────────────────────────
router.get('/homepage-content',        homeC.getContent);
router.get('/homepage-content/all',    auth, requireRole('admin'), homeC.getAllContent);
router.post('/homepage-content',       auth, requireRole('admin'), homeC.updateContent);

// ── AUDIT LOGS ──────────────────────────────────
router.get('/audit-logs', auth, requireRole('admin'), async (req,res) => {
  try {
    const pool = require('../config/db');
    const { rows } = await pool.query(`
      SELECT al.*, u.name as user_name FROM audit_logs al
      LEFT JOIN users u ON al.user_id=u.id
      ORDER BY al.created_at DESC LIMIT 200
    `);
    res.json({ data: rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
