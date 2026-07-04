const Provider = require('../Models/Provider');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all providers (optionally filter by type)
// @route   GET /api/providers?providerType=electrician&active=true&emergencyAvailable=true
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getProviders = async (req, res) => {
  try {
    const filter = {};

    if (req.query.providerType) {
      filter.providerType = req.query.providerType.toLowerCase();
    }
    if (req.query.active !== undefined) {
      filter.active = req.query.active === 'true';
    }
    if (req.query.emergencyAvailable !== undefined) {
      filter.emergencyAvailable = req.query.emergencyAvailable === 'true';
    }
    if (req.query.verified !== undefined) {
      filter.verified = req.query.verified === 'true';
    }

    const providers = await Provider.find(filter).sort({ rating: -1 });
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
// NEW
// @desc    Get the Provider listing linked to the currently logged-in user
// @route   GET /api/providers/me
// @access  Private (provider)
// ─────────────────────────────────────────────────────────────────────────────
const getMyProvider = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });

    if (!provider) {
      return res.status(404).json({ message: 'No provider listing linked to this account' });
    }

    res.status(200).json(provider);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW
// @desc    Update the Provider listing linked to the currently logged-in user.
//          A provider CANNOT set their own `verified` or `active` status —
//          that stays admin-controlled, so those two fields are stripped
//          from the update even if sent.
// @route   PUT /api/providers/me
// @access  Private (provider)
// ─────────────────────────────────────────────────────────────────────────────
const updateMyProvider = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });

    if (!provider) {
      return res.status(404).json({ message: 'No provider listing linked to this account' });
    }

    const { verified, active, user, ...allowedUpdates } = req.body;

    if (allowedUpdates.name && !allowedUpdates.initials) {
      allowedUpdates.initials = allowedUpdates.name
        .split(' ')
        .map(word => word[0].toUpperCase())
        .join('')
        .slice(0, 2);
    }

    const updated = await Provider.findByIdAndUpdate(
      provider._id,
      allowedUpdates,
      { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json(updated);

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
    const {
      name,
      providerType,
      description,
      location,
      phone,
      email,
      website,
      image,
      rating,
      reviews,
      verified,
      emergencyAvailable,
      active,
      initials,
    } = req.body;

    if (!name || !providerType || !location || !phone) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const autoInitials = initials || name
      .split(' ')
      .map(word => word[0].toUpperCase())
      .join('')
      .slice(0, 2);

    const provider = await Provider.create({
      name,
      providerType,
      description,
      location,
      phone,
      email,
      website,
      image,
      rating,
      reviews,
      verified,
      emergencyAvailable,
      active,
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

    if (req.body.name && !req.body.initials) {
      req.body.initials = req.body.name
        .split(' ')
        .map(word => word[0].toUpperCase())
        .join('')
        .slice(0, 2);
    }

    const updatedProvider = await Provider.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json(updatedProvider);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Toggle provider active status (active: true/false)
// @route   PATCH /api/providers/:id/availability
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
const toggleAvailability = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    provider.active = !provider.active;
    await provider.save();

    res.status(200).json({
      message: `Provider is now ${provider.active ? 'active' : 'inactive'}`,
      active: provider.active,
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW
// @desc    Toggle provider verified status (Admin only) — this is the approval
//          gate for the hybrid provider-registration flow.
// @route   PATCH /api/providers/:id/verify
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
const toggleVerified = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    provider.verified = !provider.verified;
    await provider.save();

    res.status(200).json({
      message: `Provider is now ${provider.verified ? 'verified' : 'unverified'}`,
      verified: provider.verified,
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
  getMyProvider,
  updateMyProvider,
  createProvider,
  updateProvider,
  toggleAvailability,
  toggleVerified,
  deleteProvider,
};