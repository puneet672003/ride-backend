import asyncHandler from 'express-async-handler';

import User from '../models/User.js';

export const registerUser = asyncHandler(async (req, res) => {
	const { name, email, password, role, address } = req.body;
	const userExists = await User.findOne({ email });

	if (userExists) {
		res.status(400);
		throw new Error('User already exists');
	}

	const user = await User.create({
		name,
		email,
		password,
		role: role || 'user',
		address,
	});

	if (user) {
		const token = user.getSignedJwtToken();

		res.status(201).json({
			success: true,
			token,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		});
	} else {
		res.status(400);
		throw new Error('Invalid user data');
	}
});

export const loginUser = asyncHandler(async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) {
		res.status(400);
		throw new Error('Please provide email and password');
	}

	const user = await User.findOne({ email }).select('+password');
	if (!user) {
		res.status(401);
		throw new Error('Invalid credentials');
	}

	const isMatch = await user.matchPassword(password);
	if (!isMatch) {
		res.status(401);
		throw new Error('Invalid credentials');
	}

	const token = user.getSignedJwtToken();
	res.status(200).json({
		success: true,
		token,
		user: {
			id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
		},
	});
});
