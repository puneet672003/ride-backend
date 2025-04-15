import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.ObjectId,
		ref: 'users',
		required: true,
	},
	cab: {
		type: mongoose.Schema.ObjectId,
		ref: 'cabs',
		required: true,
	},
	pickupLocation: {
		type: {
			type: String,
			default: 'Point',
			enum: ['Point'],
		},
		coordinates: {
			type: [Number],
			required: [true, 'Please add pickup coordinates'],
		},
	},
	dropLocation: {
		type: {
			type: String,
			default: 'Point',
			enum: ['Point'],
		},
		coordinates: {
			type: [Number],
			required: [true, 'Please add drop coordinates'],
		},
	},
	distance: {
		type: Number,
		required: [true, 'Please add distance'],
	},
	price: {
		type: Number,
		required: [true, 'Please add price'],
	},
	status: {
		type: String,
		enum: ['pending', 'accepted', 'picked', 'delivered', 'cancelled'],
		default: 'pending',
	},
	currentLocation: {
		type: {
			type: String,
			enum: ['Point'],
			default: 'Point',
		},
		coordinates: {
			type: [Number],
		},
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	completedAt: {
		type: Date,
	},
});

const orderModel = mongoose.model('orders', orderSchema);
export default orderModel;
