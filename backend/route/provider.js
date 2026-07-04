const express = require('express');
const router = express.Router();

const {
  getProviders,
  getProviderById,
  getMyProvider,
  updateMyProvider,
  createProvider,
  updateProvider,
  toggleAvailability,
  toggleVerified,
  deleteProvider,
} = require('../Controllers/provider');

const { protect ,authorize} = require('../middleware/auth');

// @route   GET /api/providers
router.get('/', getProviders);

// @route   GET /api/providers/me  — must come before /:id or "me" gets treated as an ID
router.get('/me', protect, authorize('provider'), getMyProvider);

// @route   PUT /api/providers/me
router.put('/me', protect, authorize('provider'), updateMyProvider);

// @route   GET /api/providers/:id
router.get('/:id', getProviderById);

// @route   POST /api/providers
router.post('/', protect, authorize('admin'), createProvider);

// @route   PUT /api/providers/:id
router.put('/:id', protect, authorize('admin'), updateProvider);

// @route   PATCH /api/providers/:id/availability
router.patch('/:id/availability', protect, authorize('admin'), toggleAvailability);

// @route   PATCH /api/providers/:id/verify
router.patch('/:id/verify', protect, authorize('admin'), toggleVerified);

// @route   DELETE /api/providers/:id
router.delete('/:id', protect, authorize('admin'), deleteProvider);

module.exports = router;