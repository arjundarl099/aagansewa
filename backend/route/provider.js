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

// Public routes
router.get('/',    getProviders);      // GET /api/providers?service=electrician
router.get('/:id', getProviderById);  // GET /api/providers/:id

// Admin-only routes (add your authMiddleware here later)
router.post('/',                    createProvider);      // POST   /api/providers
router.put('/:id',                  updateProvider);      // PUT    /api/providers/:id
router.patch('/:id/availability',   toggleAvailability);  // PATCH  /api/providers/:id/availability
router.delete('/:id',               deleteProvider);      // DELETE /api/providers/:id

module.exports = router;