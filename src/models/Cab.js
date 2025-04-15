import mongoose from 'mongoose';

const cabSchema = new mongoose.Schema({
	driver: {
		type: mongoose.Schema.ObjectId,
		ref: 'users',
		required: true,
	},
	vehicleType: {
		type: String,
		enum: ['car', 'bike', 'auto'],
		required: [true, 'Please specify vehicle type'],
	},
	vehicleModel: {
		type: String,
		required: [true, 'Please add vehicle model'],
		trim: true,
	},
	vehicleNumber: {
		type: String,
		required: [true, 'Please add vehicle number'],
		unique: true,
		trim: true,
	},
	capacity: {
		type: Number,
		required: [true, 'Please add capacity'],
	},
	pricePerKm: {
		type: Number,
		required: [true, 'Please add price per km'],
	},
	isAvailable: {
		type: Boolean,
		default: true,
	},
	currentLocation: {
		type: {
			type: String,
			default: 'Point',
			enum: ['Point'],
		},
		coordinates: {
			type: [Number],
			required: [true, 'Please add current location coordinates'],
		},
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

cabSchema.index({ currentLocation: '2dsphere' });
const cabModel = mongoose.model('cabs', cabSchema);

cabModel.syncIndexes();

export default cabModel;
