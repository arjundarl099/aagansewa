const mongoose = require('mongoose');

const ProviderSchema = new mongoose.Schema(
  {
    // NEW — links this listing to the User account (role: 'provider') that manages it.
    // sparse:true lets many old/admin-created providers exist with no linked user.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      sparse: true,
    },

    name: {
      type: String,
      required: [true, 'Provider name is required'],
      trim: true,
    },

    providerType: {
      type: String,
      required: [true, 'Provider type is required'],
      enum: [
        'hospital',
        'clinic',
        'electrician',
        'plumber',
        'ambulance',
        'other',
      ],
      lowercase: true,
    },

    description: {
      type: String,
      default: '',
      trim: true,
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

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },

    website: {
      type: String,
      default: '',
      trim: true,
    },

    image: {
      type: String,
      default: '',
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

    verified: {
      type: Boolean,
      default: false,
    },

    emergencyAvailable: {
      type: Boolean,
      default: false,
    },

    initials: {
      type: String,
      trim: true,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Provider', ProviderSchema);