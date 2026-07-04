// controllers/bookingController.js
const Booking = require('../Models/Bookers');
const Service = require('../Models/Services');
const errorResponse = require('../utils/errorResponse');

// Create a new booking
exports.createBooking = async (req, res, next) => {
  try {
    const {
      providerId,
      serviceId,
      date,
      timeSlot,
      description,
      service,
    } = req.body;

    const user = req.user.id;

    if (!serviceId)
      return next(new errorResponse("serviceId is required", 400));

    if (!providerId)
      return next(new errorResponse("providerId is required", 400));

    // Prevent duplicate booking
    const existingBooking = await Booking.findOne({
      provider: providerId,
      date,
      time: timeSlot,
      status: { $ne: "cancelled" },
    });

    if (existingBooking) {
      return next(
        new errorResponse("This time slot is already booked.", 400)
      );
    }

    // Reduce capacity only if capacity > 0
    const updatedService = await Service.findOneAndUpdate(
      {
        _id: serviceId,
        capacity: { $gt: 0 },
      },
      {
        $inc: {
          capacity: -1,
        },
      },
      {
        new: true,
      }
    );

    if (!updatedService) {
      return next(
        new errorResponse("This service is fully booked.", 400)
      );
    }

    // Automatically disable if capacity reaches zero
    if (updatedService.capacity === 0 && updatedService.available) {
      updatedService.available = false;
      await updatedService.save();
    }

    try {
      const booking = await Booking.create({
        user,
        provider: providerId,
        service: serviceId,
        serviceCategory: service,
        date,
        time: timeSlot,
        description,
        status: "pending",
      });

      return res.status(201).json({
        success: true,
        data: booking,
      });
    } catch (bookingError) {
      // Rollback capacity
      await Service.findByIdAndUpdate(serviceId, {
        $inc: {
          capacity: 1,
        },
      });

      throw bookingError;
    }
  } catch (err) {
    console.error(err);
    next(new errorResponse("Server error", 500));
  }
};

// Get all bookings for a user
exports.getMe = async (req, res, next) => {
  try {
    const user = req.user.id;
    const bookings = await Booking.find({ user }).populate('provider', 'name rating');
    res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    console.error(err);
    next(new errorResponse('Server error', 500));
  }
};

// Cancel a booking
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking)
      return next(new errorResponse("Booking not found", 404));

    if (booking.user.toString() !== req.user.id) {
      return next(
        new errorResponse(
          "Not authorized to cancel this booking",
          403
        )
      );
    }

    if (booking.status === "cancelled") {
      return next(
        new errorResponse("Booking already cancelled", 400)
      );
    }

    booking.status = "cancelled";
    await booking.save();

    const service = await Service.findByIdAndUpdate(
      booking.service,
      {
        $inc: {
          capacity: 1,
        },
      },
      {
        new: true,
      }
    );

    if (service && !service.available) {
      service.available = true;
      await service.save();
    }

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully.",
      data: booking,
    });
  } catch (err) {
    console.error(err);
    next(new errorResponse("Server error", 500));
  }
};
// Get a single booking
exports.getSingleBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('provider', 'name rating');

    if (!booking)
      return next(new errorResponse("Booking not found", 404));

    if (booking.user.toString() !== req.user.id) {
      return next(
        new errorResponse("Not authorized to view this booking", 403)
      );
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    console.error(err);
    next(new errorResponse("Server error", 500));
  }
};
// Add this to controllers/booker.js (alongside your other exports)

// Get all bookings — admin only
exports.getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('provider', 'name rating')
      .populate('service', 'name price');

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (err) {
    console.error(err);
    next(new errorResponse('Server error', 500));
  }
};