const { json } = require('express');
const User = require('../Models/User');
const Provider = require('../Models/Provider');
const errorResponse = require('../utils/errorResponse');
const asyncHandler = require('express-async-handler');

exports.registerUser = async (req, res, next) => {
    const { name, email, password, role, providerType, location, phone } = req.body;
    try {
        const user = await User.create({
            name,
            email,
            password,
            role,
        });

        // Hybrid onboarding: if this account is a provider, auto-create a linked
        // Provider listing right away, but keep it hidden (unverified/inactive)
        // until an admin reviews it — matches the "verified in person" promise
        // already on the homepage.
        if (role === 'provider') {
            if (!providerType || !location || !phone) {
                // Roll back the user so we don't leave a provider-role account
                // with no listing and no way to create one later without an ID.
                await User.findByIdAndDelete(user._id);
                return next(
                    new errorResponse(
                        'providerType, location, and phone are required to register as a provider',
                        400
                    )
                );
            }

            const initials = name
                .split(' ')
                .map((word) => word[0].toUpperCase())
                .join('')
                .slice(0, 2);

            await Provider.create({
                user: user._id,
                name,
                providerType,
                location,
                phone,
                initials,
                verified: false,
                active: false, // hidden from public listings until admin approves
            });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

exports.loginUser = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new errorResponse('please fill up both feild', 400));
    }
    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return next(new errorResponse('invalid credential', 401));
        }
        const ismatch = await user.matchPassword(password);
        if (!ismatch) {
            return next(new errorResponse('invalid credential', 401));
        }

        sendTokenResponse(user, 200, res);
    }
    catch (err) {
        next(err);
    }
}

const sendTokenResponse = (user, status, res) => {
    const token = user.getSignedJwtToken();
    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
        ),
        httpOnly: true,
        sameSite: 'Lax'
    }
    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }
    res.status(status)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            // NEW — role included directly so the frontend doesn't have to decode
            // the JWT just to know where to redirect after login.
            role: user.role,
        });
}
exports.getMe = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
        data: user
    });
}
exports.updateUserDetails = asyncHandler(async (req, res, next) => {
    const userUpdatedDetails = {
        name: req.body.name,
        email: req.body.email
    }
    const user = await User.findByIdAndUpdate(req.user.id, userUpdatedDetails, {
        returnDocument: "after"
    });
    if (!user) {
        return next(new errorResponse('invalid credential', 401));
    }
    res.status(201).json({
        success: true,
        data: user,
    })
})