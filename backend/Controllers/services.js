const Service = require('../Models/Services');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all services (optionally filter by category, provider, available)
// @route   GET /api/services?category=electrician&provider=<id>&available=true
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getServices = async (req, res) => {
  try {
    const filter = {};

    // Filter by category if query param is provided
    if (req.query.category) {
      filter.category = req.query.category.toLowerCase();
    }

    // Filter by provider if query param is provided
    if (req.query.provider) {
      filter.provider = req.query.provider;
    }

    // Filter by available if query param is provided (?available=true)
    if (req.query.available !== undefined) {
      filter.available = req.query.available === 'true';
    }

    const services = await Service.find(filter)
      .populate('provider', 'name providerType location phone rating verified')
      .sort({ rating: -1 }); // highest rated first

    res.status(200).json(services);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get a single service by ID
// @route   GET /api/services/:id
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('provider', 'name providerType location phone rating verified');

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.status(200).json(service);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all services belonging to a specific provider
// @route   GET /api/services/provider/:providerId
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getServicesByProvider = async (req, res) => {
  try {
    const services = await Service.find({ provider: req.params.providerId }).sort({ rating: -1 });
    res.status(200).json(services);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Add a new service (Admin / Provider)
// @route   POST /api/services
// @access  Private (Admin/Provider)
// ─────────────────────────────────────────────────────────────────────────────
const createService = async (req, res) => {
  try {
    const {
      provider,
      category,
      name,
      description,
      price,
      experience,
      duration,
      available,
      capacity,
      rating,
      reviews,
      icon,
    } = req.body;

    // Basic validation (matches required fields in schema)
    if (!provider || !category || !name || price === undefined || price === null) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const service = await Service.create({
      provider,
      category,
      name,
      description,
      price,
      experience,
      duration,
      available,
      capacity,
      rating,
      reviews,
      icon,
    });

    res.status(201).json({ message: 'Service created successfully', service });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update service details (Admin / Provider)
// @route   PUT /api/services/:id
// @access  Private (Admin/Provider)
// ─────────────────────────────────────────────────────────────────────────────
const updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after', runValidators: true }
    );

    // ← Must return updatedService directly, NOT { message, service }
    res.status(200).json(updatedService);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Toggle service availability (available: true/false)
// @route   PATCH /api/services/:id/availability
// @access  Private (Admin/Provider)
// ─────────────────────────────────────────────────────────────────────────────
const toggleAvailability = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    service.available = !service.available; // flip the value
    await service.save();

    res.status(200).json({
      message: `Service is now ${service.available ? 'available' : 'unavailable'}`,
      available: service.available,
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a service (Admin / Provider)
// @route   DELETE /api/services/:id
// @access  Private (Admin/Provider)
// ─────────────────────────────────────────────────────────────────────────────
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    await service.deleteOne();
    res.status(200).json({ message: 'Service deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  getServices,
  getServiceById,
  getServicesByProvider,
  createService,
  updateService,
  toggleAvailability,
  deleteService,
};