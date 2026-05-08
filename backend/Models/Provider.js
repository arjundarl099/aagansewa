const mongoose = require('mongoose');

const ProviderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Provider name is required'],
      trim: true,
    },

    service: {
      type: String,
      required: [true, 'Service type is required'],
      enum: ['electrician', 'plumber', 'ambulance', 'doctor'],
      lowercase: true,
    },

    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },

    experience: {
      type: String, // e.g. "8 yrs"
      default: 'N/A',
    },

    price: {
      type: Number, // price per hour in Rs.
      required: [true, 'Price is required'],
      min: 0,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviews: {
      type: Number,
      default: 0,
    },

    available: {
      type: Boolean,
      default: true,
    },

    initials: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true } 
);

module.exports = mongoose.model('Provider', ProviderSchema);