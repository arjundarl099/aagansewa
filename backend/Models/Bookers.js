

const mongoose = require('mongoose');


const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // IMPORTANT: keep this consistent with Services model.
    // This field was previously stored as String, but we migrate it to ObjectId.
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Services',
      required: true,
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      default: '',
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },

    // Required for dashboard separation:
    // - cancelledBy = "user" => cancelled by customer
    // - cancelledBy = "provider" => cancelled by provider
    cancelledBy: {
      type: String,
      enum: ['user', 'provider'],
      default: null,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate bookings for the same provider at the same date + time slot.
// (Your requirement: prevent duplicate bookings for same provider/date/time slot.)
bookingSchema.index({ provider: 1, date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Bookers', bookingSchema);

