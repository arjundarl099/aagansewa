const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      required: [true, 'Provider is required'],
    },

    category: {
      type: String,
      required: true,
      enum: [
        'doctor',
        'ambulance',
        'electrician',
        'plumber',
      ],
      lowercase: true,
    },

    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },

    description: {
      type: String,
      default: '',
    },

    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },

    experience: {
      type: String,
      default: 'N/A',
    },

    duration: {
      type: Number, // in minutes
      default: 60,
    },

    available: {
      type: Boolean,
      default: true,
    },

    capacity: {
     type: Number,
    required: [true, 'Service capacity is required'],
    default: 1,
    min: 1,
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

    icon: {
      type: String,
      default: '🔧',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Services', ServiceSchema);