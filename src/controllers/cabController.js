import asyncHandler from 'express-async-handler';

import Cab from '../models/Cab.js';

export const getCabs = asyncHandler(async (req, res) => {
	let query = {};

	if (req.query.available) {
		query.isAvailable = req.query.available === 'true';
	}
	if (req.query.vehicleType) {
		query.vehicleType = req.query.vehicleType;
	}

	if (req.query.lat && req.query.lng && req.query.maxDistance) {
		query.currentLocation = {
			$near: {
				$geometry: {
					type: 'Point',
					coordinates: [parseFloat(req.query.lng), parseFloat(req.query.lat)],
				},
				$maxDistance: parseInt(req.query.maxDistance) * 1000, // Convert to meters
			},
		};
	}

	const cabs = await Cab.find(query).populate({
		path: 'driver',
		select: 'name email',
	});

	res.status(200).json({
		success: true,
		count: cabs.length,
		data: cabs,
	});
});

export const getCab = asyncHandler(async (req, res) => {
	const cab = await Cab.findById(req.params.id).populate({
		path: 'driver',
		select: 'name email',
	});

	if (!cab) {
		res.status(404);
		throw new Error('Cab not found');
	}

	res.status(200).json({
		success: true,
		data: cab,
	});
});

export const createCab = asyncHandler(async (req, res) => {
	req.body.driver = req.user.id;
	const cabExists = await Cab.findOne({
		vehicleNumber: req.body.vehicleNumber,
	});

	if (cabExists) {
		res.status(400);
		throw new Error('Vehicle with this number already registered');
	}

	const cab = await Cab.create(req.body);
	res.status(201).json({
		success: true,
		data: cab,
	});
});

export const updateCab = asyncHandler(async (req, res) => {
	let cab = await Cab.findById(req.params.id);
	if (!cab) {
		res.status(404);
		throw new Error('Cab not found');
	}

	if (cab.driver.toString() !== req.user.id) {
		res.status(401);
		throw new Error('Not authorized to update this cab');
	}

	cab = await Cab.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	});

	res.status(200).json({
		success: true,
		data: cab,
	});
});
