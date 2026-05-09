// controllers/bookingController.js
const Booking = require('../Models/Bookers');
const errorResponse = require('../utils/errorResponse');

// Create a new booking
exports.createBooking = async (req, res,next) => {
  try {
    console.log(req.body);
    const { providerId, date, timeSlot, description,service } = req.body;

    // Assuming user ID is available via auth middleware
    const user = req.user.id;

    // Simple check: prevent double booking for same provider at same time
    const existing = await Booking.findOne({ providerId, date, timeSlot });
    if (existing) {
      return next(new errorResponse('This time slot is already booked.',400));
    }

    const booking = await Booking.create({
      user,
      provider: providerId,
      date, 
      time:timeSlot,
      service,
      description
    });

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    console.log(err);
    next(new errorResponse('server Errror',500));
  }
};

// Optional: Get all bookings for a user
exports.getMe = async (req, res,next) => {
  try {
    const user = req.user.id;
    const bookings = await Booking.find({ user })
    .populate('provider', 'name rating');
    res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    next(new errorResponse('server Error!', 500));
    console.log(err);
  }
};
// Cancel a booking
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new errorResponse('Booking not found', 404));
    }

    // Make sure the logged-in user owns this booking
    if (booking.user.toString() !== req.user.id) {
      return next(new errorResponse('Not authorized to cancel this booking', 403));
    }

    // Optional: prevent cancelling already-cancelled bookings
    if (booking.status === 'cancelled') {
      return next(new errorResponse('Booking is already cancelled', 400));
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({ success: true, message: 'Booking cancelled', data: booking });
  } catch (err) {
    next(new errorResponse('Server error', 500));
  }
};
// Get a single booking
exports.getSingleBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('provider', 'name rating');

    if (!booking) {
      return next(new errorResponse('Booking not found', 404));
    }

    // Make sure the logged-in user owns this booking
    if (booking.user.toString() !== req.user.id) {
      return next(new errorResponse('Not authorized to view this booking', 403));
    }

    res.status(200).json({ success: true, data: booking });
  } catch (err) {
    next(new errorResponse('Server error', 500));
  }
};