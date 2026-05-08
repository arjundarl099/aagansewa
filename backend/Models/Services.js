const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: {
    type: String,
    required: [true,'please provide name of the service'],
    trim: true
  },

  slug: {
    type: String,
    unique: true,
    lowercase: true
  },

  icon: {
    type: String, // emoji or icon class
    default: "🔧"
  },

  description: {
    type: String,
    required: [true,'please provide description of the service']
  }
}, {
  timestamps: true
});




module.exports = mongoose.model('Services',serviceSchema);
