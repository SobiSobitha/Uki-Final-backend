const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes (all users: both volunteers and organizers)
exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.userId).select('-password');
        if (!req.user) {
            return res.status(404).json({ error: 'User not found' });
        }

        next();
    } catch (error) {
        res.status(401).json({ error: 'Not authorized, invalid token' });
    }
};

// Middleware to check if user is an approved organizer
exports.isApprovedOrganizer = async (req, res, next) => {
    await exports.protect(req, res, async () => {
        const user = req.user;

        if (user.role !== 'Organizer' || !user.isApproved) {
            return res.status(403).json({ message: 'Access denied. Only approved organizers can access this page.' });
        }

        next();
    });
};

// Middleware to restrict access to approved organizers only
exports.organizerProtect = async (req, res, next) => {
    await exports.protect(req, res, async () => {
        if (req.user.role !== 'Organizer' || !req.user.isApproved) {
            return res.status(403).json({ error: 'Access denied: Not an approved organizer' });
        }
        next();
    });
};

// Middleware to restrict access to admins only
exports.adminProtect = async (req, res, next) => {
    await exports.protect(req, res, async () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin only' });
        }
        next();
    });
};

// Middleware to restrict access to volunteers only
exports.volunteerProtect = async (req, res, next) => {
    await exports.protect(req, res, async () => {
        if (req.user.role !== 'volunteer') {
            return res.status(403).json({ error: 'Access denied: Not a volunteer' });
        }
        next();
    });
};

// Middleware to ensure that an organizer is creating an event
exports.organizerEventProtect = async (req, res, next) => {
    await exports.organizerProtect(req, res, async () => {
        next();
    });
};
