import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';

import User from '../models/User.js';
import { JWT_SECRET } from '../config/env.js';

export const protect = asyncHandler(async (req, res, next) => {
	let token;
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		token = req.headers.authorization.split(' ')[1];
	}

	if (!token) {
		return res.status(401).json({
			success: false,
			error: 'Not authorized to access this route',
		});
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		req.user = await User.findById(decoded.id);

		next();
	} catch (err) {
		return res.status(401).json({
			success: false,
			error: 'Not authorized to access this route',
		});
	}
});

export const authorize = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return res.status(403).json({
				success: false,
				error: `User role ${req.user.role} is not authorized to access this route`,
			});
		}
		next();
	};
};
