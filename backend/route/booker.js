const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createBooking,
  getMe,
  getSingleBooking,
  cancelBooking
} = require('../controllers/booker');

router
.route('/')
.post(protect,createBooking)
.get(protect,getMe);

router.get('/:id',        protect, getSingleBooking);
router.patch('/:id/cancel', protect, cancelBooking);

module.exports = router;