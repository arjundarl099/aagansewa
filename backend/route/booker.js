const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createBooking,
  getUserBookings,
  getSingleBooking,
  cancelBooking
} = require('../controllers/booker');

router
.route('/')
.post(protect,createBooking)
.get(protect,getUserBookings);

router.get('/:id',        protect, getSingleBooking);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;