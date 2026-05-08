const Provider = require('../Models/Provider');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all providers (optionally filter by service)
// @route   GET /api/providers?service=electrician
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getProviders = async (req, res) => {
  try {
    const filter = {};

    // Filter by service if query param is provided
    if (req.query.service) {
      filter.service = req.query.service.toLowerCase();
    }

    // Filter by available if query param is provided (?available=true)
    if (req.query.available !== undefined) {
      filter.available = req.query.available === 'true';
    }

    const providers = await Provider.find(filter).sort({ rating: -1 }); // highest rated first
    res.status(200).json(providers);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get a single provider by ID
// @route   GET /api/providers/:id
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getProviderById = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.status(200).json(provider);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Add a new provider (Admin only)
// @route   POST /api/providers
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
const createProvider = async (req, res) => {
  try {
    const { name, service, location, phone, experience, price, available, initials } = req.body;

    // Basic validation
    if (!name || !service || !location || !phone || !price) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Auto-generate initials if not provided
    const autoInitials = initials || name
      .split(' ')
      .map(word => word[0].toUpperCase())
      .join('')
      .slice(0, 2);

    const provider = await Provider.create({
      name,
      service,
      location,
      phone,
      experience,
      price,
      available,
      initials: autoInitials,
    });

    res.status(201).json({ message: 'Provider created successfully', provider });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update provider details (Admin only)
// @route   PUT /api/providers/:id
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
const updateProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const updatedProvider = await Provider.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // return updated doc + run schema validation
    );

    res.status(200).json({ message: 'Provider updated successfully', provider: updatedProvider });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Toggle provider availability (available: true/false)
// @route   PATCH /api/providers/:id/availability
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
const toggleAvailability = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    provider.available = !provider.available; // flip the value
    await provider.save();

    res.status(200).json({
      message: `Provider is now ${provider.available ? 'available' : 'unavailable'}`,
      available: provider.available,
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a provider (Admin only)
// @route   DELETE /api/providers/:id
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
const deleteProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    await provider.deleteOne();
    res.status(200).json({ message: 'Provider deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  getProviders,
  getProviderById,
  createProvider,
  updateProvider,
  toggleAvailability,
  deleteProvider,
};