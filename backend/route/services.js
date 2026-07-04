const express = require('express');
const router = express.Router();

const {
  getServices,
  getServiceById,
  getServicesByProvider,
  createService,
  updateService,
  toggleAvailability,
  deleteService,
} = require('../Controllers/services');

// ─────────────────────────────────────────────────────────────
// Public Routes
// ─────────────────────────────────────────────────────────────

// Get all services
// GET /api/services
router.get('/', getServices);

// Get a single service by ID
// GET /api/services/:id
router.get('/:id', getServiceById);

// Get all services of a specific provider
// GET /api/services/provider/:providerId
router.get('/provider/:providerId', getServicesByProvider);

// ─────────────────────────────────────────────────────────────
// Private Routes (Admin / Provider)
// Add authentication & authorization middleware later
// ─────────────────────────────────────────────────────────────

// Create a new service
// POST /api/services
router.post('/', createService);

// Update a service
// PUT /api/services/:id
router.put('/:id', updateService);

// Toggle service availability
// PATCH /api/services/:id/availability
router.patch('/:id/availability', toggleAvailability);

// Delete a service
// DELETE /api/services/:id
router.delete('/:id', deleteService);

module.exports = router;