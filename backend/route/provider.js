const express = require('express');
const router  = express.Router();

const {
  getProviders,
  getProviderById,
  createProvider,
  updateProvider,
  toggleAvailability,
  deleteProvider,
} = require('../Controllers/provider');

const { protect, authorize } = require('../middleware/auth');

// ── Public routes (anyone can view providers) ─────────────────────────────
router.get('/',     getProviders);      // GET /api/v1/providers?service=electrician
router.get('/:id',  getProviderById);   // GET /api/v1/providers/:id

// ── Admin-only routes ─────────────────────────────────────────────────────
router.post('/',
  protect, authorize('admin'),
  createProvider
);

router.put('/:id',
  protect, authorize('admin'),
  updateProvider
);

router.patch('/:id/availability',
  protect, authorize('admin'),
  toggleAvailability
);

router.delete('/:id',
  protect, authorize('admin'),
  deleteProvider
);

module.exports = router;