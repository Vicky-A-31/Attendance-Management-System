const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin.model');
const Staff = require('../models/Staff.model');

// Verify JWT token
const verifyToken = async (req, res, next) => {
    try {
        let token;

        // Check for token in headers or query params
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route. No token provided.'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user to request
            req.user = {
                id: decoded.id,
                role: decoded.role,
                email: decoded.email
            };

            next();
        } catch (err) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route. Invalid token.'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Server error during authentication'
        });
    }
};

// Check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin privileges required.'
            });
        }

        // Verify admin exists and is active
        const admin = await Admin.findById(req.user.id);

        if (!admin || !admin.isActive) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin account not found or inactive.'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Server error during authorization'
        });
    }
};

// Check if user is staff
const isStaff = async (req, res, next) => {
    try {
        if (req.user.role !== 'staff') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Staff privileges required.'
            });
        }

        // Verify staff exists and is active
        const staff = await Staff.findById(req.user.id);

        if (!staff || !staff.isActive) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Staff account not found or inactive.'
            });
        }

        // Attach full staff details to request
        req.staff = staff;

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Server error during authorization'
        });
    }
};

// Check if user is either admin or staff
const isAdminOrStaff = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin or Staff privileges required.'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Server error during authorization'
        });
    }
};

module.exports = {
    verifyToken,
    isAdmin,
    isStaff,
    isAdminOrStaff
};
