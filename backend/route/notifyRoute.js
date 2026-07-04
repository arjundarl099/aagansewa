const express = require('express');
const router  = express.Router();
const { notifyCancellation } = require('../controllers/notifyController');
const protect = require('../middleware/authMiddleware'); // your existing auth middleware

// POST /api/v1/booker/:id/notify-cancel
router.post('/:id/notify-cancel', protect, notifyCancellation);

module.exports = router;