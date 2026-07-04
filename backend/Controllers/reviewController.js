const mongoose = require('mongoose');
const Review = require('../Models/Review');
const Provider = require('../Models/Provider');
const Service = require('../Models/Services');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: recalculate average rating + review count for a Provider and Service
// after a review is created, updated, or deleted.
// ─────────────────────────────────────────────────────────────────────────────
const recalculateRatings = async (providerId, serviceId) => {
  // Provider aggregate
  const providerStats = await Review.aggregate([
    { $match: { provider: new mongoose.Types.ObjectId(providerId) } },
    { $group: { _id: '$provider', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Provider.findByIdAndUpdate(providerId, {
    rating: providerStats.length ? Math.round(providerStats[0].avgRating * 10) / 10 : 0,
    reviews: providerStats.length ? providerStats[0].count : 0,
  });

  // Service aggregate
  const serviceStats = await Review.aggregate([
    { $match: { service: new mongoose.Types.ObjectId(serviceId) } },
    { $group: { _id: '$service', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Service.findByIdAndUpdate(serviceId, {
    rating: serviceStats.length ? Math.round(serviceStats[0].avgRating * 10) / 10 : 0,
    reviews: serviceStats.length ? serviceStats[0].count : 0,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all reviews (optionally filter by provider, service, or user)
// @route   GET /api/reviews?provider=<id>&service=<id>&user=<id>
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getReviews = async (req, res) => {
  try {
    const filter = {};

    if (req.query.provider) filter.provider = req.query.provider;
    if (req.query.service) filter.service = req.query.service;
    if (req.query.user) filter.user = req.query.user;

    const reviews = await Review.find(filter)
      .populate('user', 'name')
      .populate('provider', 'name providerType')
      .populate('service', 'name category')
      .sort({ createdAt: -1 }); // newest first

    res.status(200).json(reviews);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get a single review by ID
// @route   GET /api/reviews/:id
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'name')
      .populate('provider', 'name providerType')
      .populate('service', 'name category');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json(review);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all reviews for a specific provider
// @route   GET /api/reviews/provider/:providerId
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getReviewsByProvider = async (req, res) => {
  try {
    const reviews = await Review.find({ provider: req.params.providerId })
      .populate('user', 'name')
      .populate('service', 'name category')
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all reviews for a specific service
// @route   GET /api/reviews/service/:serviceId
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getReviewsByService = async (req, res) => {
  try {
    const reviews = await Review.find({ service: req.params.serviceId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a new review (one per completed booking)
// @route   POST /api/reviews
// @access  Private (User)
// ─────────────────────────────────────────────────────────────────────────────
const createReview = async (req, res) => {
  try {
    const { user, provider, service, booking, rating, comment } = req.body;

    // Basic validation
    if (!user || !provider || !service || !booking || !rating || !comment) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const review = await Review.create({ user, provider, service, booking, rating, comment });

    // Keep provider & service rating/review counts in sync
    await recalculateRatings(provider, service);

    res.status(201).json({ message: 'Review created successfully', review });

  } catch (error) {
    // Duplicate key error → booking already has a review (unique index)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This booking has already been reviewed' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update a review (rating/comment only)
// @route   PUT /api/reviews/:id
// @access  Private (User who owns the review)
// ─────────────────────────────────────────────────────────────────────────────
const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Only rating/comment should ever change on an existing review
    if (req.body.rating !== undefined) review.rating = req.body.rating;
    if (req.body.comment !== undefined) review.comment = req.body.comment;

    const updatedReview = await review.save();

    // Rating changed → recalc provider & service averages
    await recalculateRatings(updatedReview.provider, updatedReview.service);

    res.status(200).json(updatedReview);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (User who owns the review, or Admin)
// ─────────────────────────────────────────────────────────────────────────────
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const { provider, service } = review;

    await review.deleteOne();

    // Recalculate after removal
    await recalculateRatings(provider, service);

    res.status(200).json({ message: 'Review deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  getReviews,
  getReviewById,
  getReviewsByProvider,
  getReviewsByService,
  createReview,
  updateReview,
  deleteReview,
};