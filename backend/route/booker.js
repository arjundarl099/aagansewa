const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createBooking,
  getMe,
  getSingleBooking,
  cancelBooking,
  getAllBookings,
} = require('../controllers/booker');

router
  .route('/')
  .post(protect, createBooking)
  .get(protect, getMe);

// IMPORTANT: /all must come BEFORE /:id, otherwise Express matches "all"
// as the :id param and getSingleBooking tries to cast "all" to an ObjectId.
router.get('/all', protect, authorize('admin'), getAllBookings);

router.get('/:id', protect, getSingleBooking);
router.patch('/:id/cancel', protect, cancelBooking);

module.exports = router;