import asyncHandler from 'express-async-handler';

import Cab from '../models/Cab.js';
import Order from '../models/Order.js';

export const createOrder = asyncHandler(async (req, res) => {
	req.body.user = req.user.id;

	const cab = await Cab.findById(req.body.cab);

	if (!cab) {
		res.status(404);
		throw new Error('Cab not found');
	}

	if (!cab.isAvailable) {
		res.status(400);
		throw new Error('Cab is not available at the moment');
	}

	const distance = req.body.distance || 0;
	const price = distance * cab.pricePerKm;

	const order = await Order.create({
		...req.body,
		price,
	});

	await Cab.findByIdAndUpdate(cab._id, { isAvailable: false });

	res.status(201).json({
		success: true,
		data: order,
	});
});

export const getOrders = asyncHandler(async (req, res) => {
	let query = { user: req.user.id };

	if (req.user.role === 'driver') {
		const cab = await Cab.findOne({ driver: req.user.id });

		if (cab) {
			query = { cab: cab._id };
		}
	}

	if (req.query.status) {
		query.status = req.query.status;
	}

	const orders = await Order.find(query)
		.populate({
			path: 'user',
			select: 'name email',
		})
		.populate({
			path: 'cab',
			select: 'vehicleType vehicleModel vehicleNumber driver',
			populate: {
				path: 'driver',
				select: 'name email',
			},
		});

	res.status(200).json({
		success: true,
		count: orders.length,
		data: orders,
	});
});

export const getOrder = asyncHandler(async (req, res) => {
	const order = await Order.findById(req.params.id)
		.populate({
			path: 'user',
			select: 'name email',
		})
		.populate({
			path: 'cab',
			select: 'vehicleType vehicleModel vehicleNumber driver',
			populate: {
				path: 'driver',
				select: 'name email',
			},
		});

	if (!order) {
		res.status(404);
		throw new Error('Order not found');
	}

	const cab = await Cab.findById(order.cab);
	if (
		order.user._id.toString() !== req.user.id &&
		cab.driver.toString() !== req.user.id
	) {
		res.status(401);
		throw new Error('Not authorized to access this order');
	}

	res.status(200).json({
		success: true,
		data: order,
	});
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
	let order = await Order.findById(req.params.id);

	if (!order) {
		res.status(404);
		throw new Error('Order not found');
	}

	const cab = await Cab.findById(order.cab);
	if (cab.driver.toString() !== req.user.id) {
		res.status(401);
		throw new Error('Not authorized to update this order');
	}

	const { status } = req.body;

	if (!status) {
		res.status(400);
		throw new Error('Please provide status to update');
	}

	order = await Order.findByIdAndUpdate(
		req.params.id,
		{ status, ...(status === 'delivered' ? { completedAt: Date.now() } : {}) },
		{ new: true, runValidators: true }
	);

	if (status === 'delivered' || status === 'cancelled') {
		await Cab.findByIdAndUpdate(order.cab, { isAvailable: true });
	}

	res.status(200).json({
		success: true,
		data: order,
	});
});

export const updateOrderLocation = asyncHandler(async (req, res) => {
	let order = await Order.findById(req.params.id);

	if (!order) {
		res.status(404);
		throw new Error('Order not found');
	}

	const cab = await Cab.findById(order.cab);
	if (cab.driver.toString() !== req.user.id) {
		res.status(401);
		throw new Error('Not authorized to update this order location');
	}

	const { coordinates } = req.body;

	if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
		res.status(400);
		throw new Error('Please provide valid coordinates [longitude, latitude]');
	}

	order = await Order.findByIdAndUpdate(
		req.params.id,
		{
			currentLocation: {
				type: 'Point',
				coordinates,
				lastUpdated: Date.now(),
			},
		},
		{ new: true }
	);

	res.status(200).json({
		success: true,
		data: order,
	});
});

export const trackOrder = asyncHandler(async (req, res) => {
	const order = await Order.findById(req.params.id)
		.select('status currentLocation pickupLocation dropLocation cab')
		.populate({
			path: 'cab',
			select: 'driver vehicleType vehicleNumber',
			populate: {
				path: 'driver',
				select: 'name email',
			},
		});

	if (!order) {
		res.status(404);
		throw new Error('Order not found');
	}

	if (
		order.user.toString() !== req.user.id &&
		order.cab.driver._id.toString() !== req.user.id
	) {
		res.status(401);
		throw new Error('Not authorized to track this order');
	}

	const trackingInfo = {
		orderId: order._id,
		status: order.status,
		pickupLocation: order.pickupLocation,
		dropLocation: order.dropLocation,
		currentLocation: order.currentLocation,
		driver: {
			name: order.cab.driver.name,
			email: order.cab.driver.email,
		},
		vehicle: {
			type: order.cab.vehicleType,
			number: order.cab.vehicleNumber,
		},
	};

	res.status(200).json({
		success: true,
		data: trackingInfo,
	});
});
