import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import User from '../models/User.js';
import Cab from '../models/Cab.js';

let mongoServer;

beforeAll(async () => {
	if (!mongoose.connection) {
		mongoServer = await MongoMemoryServer.create();
		const uri = mongoServer.getUri();
		await mongoose.connect(uri);
	}
});

afterAll(async () => {
	if (mongoServer) {
		await mongoose.connection.close();
		await mongoServer.stop();
	}
});

afterEach(async () => {
	await User.deleteMany();
	await Cab.deleteMany();
});

// Helper to create user and get token
const createUserAndGetToken = async (userDetails = {}) => {
	const defaultUser = {
		name: 'Test User',
		email: 'test@example.com',
		password: 'password123',
		role: 'driver',
	};

	const user = await User.create({ ...defaultUser, ...userDetails });
	return { user, token: user.getSignedJwtToken() };
};

// Helper to create cab
const createCab = async (driverId, cabDetails = {}) => {
	const defaultCab = {
		driver: driverId,
		vehicleType: 'car',
		vehicleModel: 'Toyota Camry',
		vehicleNumber: 'ABC123',
		capacity: 4,
		pricePerKm: 10,
		isAvailable: true,
		currentLocation: {
			type: 'Point',
			coordinates: [72.8777, 19.076], // Mumbai coordinates
		},
		rating: 4.5,
	};

	return await Cab.create({ ...defaultCab, ...cabDetails });
};

describe('Cab Listing API', () => {
	// Test 1: Get all cabs - Empty response when no cabs exist
	test('Should return empty array when no cabs exist', async () => {
		const res = await request(app).get('/cabs');

		expect(res.statusCode).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.count).toBe(0);
		expect(Array.isArray(res.body.data)).toBe(true);
		expect(res.body.data.length).toBe(0);
	});

	// Test 2: Get all cabs - Public access
	test('Should get all cabs', async () => {
		const driver = await User.create({
			name: 'Test Driver',
			email: 'driver@example.com',
			password: 'password123',
			role: 'driver',
		});

		await createCab(driver._id, { vehicleNumber: 'CAB001' });
		await createCab(driver._id, {
			vehicleNumber: 'CAB002',
			vehicleType: 'bike',
		});
		await createCab(driver._id, {
			vehicleNumber: 'CAB003',
			isAvailable: false,
		});

		const res = await request(app).get('/cabs');

		expect(res.statusCode).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.count).toBe(3);
		expect(Array.isArray(res.body.data)).toBe(true);
		expect(res.body.data.length).toBe(3);
		expect(res.body.data[0].driver).toHaveProperty('name');
		expect(res.body.data[0].driver).toHaveProperty('email');
	});

	// Test 3: Filter cabs by availability - Available cabs
	test('Should filter cabs by availability - Available only', async () => {
		const driver = await User.create({
			name: 'Test Driver',
			email: 'driver@example.com',
			password: 'password123',
			role: 'driver',
		});

		await createCab(driver._id, { vehicleNumber: 'CAB001', isAvailable: true });
		await createCab(driver._id, { vehicleNumber: 'CAB002', isAvailable: true });
		await createCab(driver._id, {
			vehicleNumber: 'CAB003',
			isAvailable: false,
		});
		await createCab(driver._id, {
			vehicleNumber: 'CAB004',
			isAvailable: false,
		});

		const res = await request(app).get('/cabs?available=true');

		expect(res.statusCode).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.count).toBe(2);
		expect(res.body.data.every((cab) => cab.isAvailable === true)).toBe(true);
	});

	// Test 4: Filter cabs by availability - Unavailable cabs
	test('Should filter cabs by availability - Unavailable only', async () => {
		const driver = await User.create({
			name: 'Test Driver',
			email: 'driver@example.com',
			password: 'password123',
			role: 'driver',
		});

		await createCab(driver._id, { vehicleNumber: 'CAB001', isAvailable: true });
		await createCab(driver._id, { vehicleNumber: 'CAB002', isAvailable: true });
		await createCab(driver._id, {
			vehicleNumber: 'CAB003',
			isAvailable: false,
		});
		await createCab(driver._id, {
			vehicleNumber: 'CAB004',
			isAvailable: false,
		});

		const res = await request(app).get('/cabs?available=false');

		expect(res.statusCode).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.count).toBe(2);
		expect(res.body.data.every((cab) => cab.isAvailable === false)).toBe(true);
	});

	// Test 5: Filter cabs by vehicle type - Cars only
	test('Should filter cabs by vehicle type - Cars only', async () => {
		const driver = await User.create({
			name: 'Test Driver',
			email: 'driver@example.com',
			password: 'password123',
			role: 'driver',
		});

		await createCab(driver._id, {
			vehicleNumber: 'CAB001',
			vehicleType: 'car',
		});
		await createCab(driver._id, {
			vehicleNumber: 'CAB002',
			vehicleType: 'bike',
		});
		await createCab(driver._id, {
			vehicleNumber: 'CAB003',
			vehicleType: 'car',
		});
		await createCab(driver._id, {
			vehicleNumber: 'CAB004',
			vehicleType: 'auto',
		});

		const res = await request(app).get('/cabs?vehicleType=car');

		expect(res.statusCode).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.count).toBe(2);
		expect(res.body.data.every((cab) => cab.vehicleType === 'car')).toBe(true);
	});

	// Test 6: Filter cabs by vehicle type - No results
	test('Should handle when no cabs match the vehicle type filter', async () => {
		const driver = await User.create({
			name: 'Test Driver',
			email: 'driver@example.com',
			password: 'password123',
			role: 'driver',
		});

		await createCab(driver._id, {
			vehicleNumber: 'CAB001',
			vehicleType: 'car',
		});
		await createCab(driver._id, {
			vehicleNumber: 'CAB002',
			vehicleType: 'bike',
		});
		await createCab(driver._id, {
			vehicleNumber: 'CAB003',
			vehicleType: 'auto',
		});

		const res = await request(app).get('/cabs?vehicleType=truck');

		expect(res.statusCode).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.count).toBe(0);
		expect(res.body.data.length).toBe(0);
	});

	// Test 7: Multiple filters combined
	test('Should apply multiple filters together', async () => {
		const driver = await User.create({
			name: 'Test Driver',
			email: 'driver@example.com',
			password: 'password123',
			role: 'driver',
		});

		await createCab(driver._id, {
			vehicleNumber: 'CAB001',
			vehicleType: 'car',
			isAvailable: true,
		});
		await createCab(driver._id, {
			vehicleNumber: 'CAB002',
			vehicleType: 'car',
			isAvailable: false,
		});
		await createCab(driver._id, {
			vehicleNumber: 'CAB003',
			vehicleType: 'bike',
			isAvailable: true,
		});
		await createCab(driver._id, {
			vehicleNumber: 'CAB004',
			vehicleType: 'bike',
			isAvailable: false,
		});

		const res = await request(app).get('/cabs?vehicleType=car&available=true');

		expect(res.statusCode).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.count).toBe(1);
		expect(res.body.data[0].vehicleType).toBe('car');
		expect(res.body.data[0].isAvailable).toBe(true);
	});

	// Test 8: Get single cab by ID
	test('Should get single cab by ID', async () => {
		const driver = await User.create({
			name: 'Test Driver',
			email: 'driver@example.com',
			password: 'password123',
			role: 'driver',
		});

		const cab = await createCab(driver._id);
		const res = await request(app).get(`/cabs/${cab._id}`);

		expect(res.statusCode).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data._id).toBe(cab._id.toString());
		expect(res.body.data.vehicleNumber).toBe(cab.vehicleNumber);

		expect(res.body.data.driver).toHaveProperty('name', driver.name);
		expect(res.body.data.driver).toHaveProperty('email', driver.email);
	});

	// Test 9: Return 404 for non-existent cab ID
	test('Should return 404 for non-existent cab ID', async () => {
		const nonExistentId = new mongoose.Types.ObjectId();

		const res = await request(app).get(`/cabs/${nonExistentId}`);

		expect(res.statusCode).toBe(404);
		expect(res.body.success).toBe(false);
		expect(res.body).toHaveProperty('error');
	});

	// Test 10: Handle invalid MongoDB ObjectId format
	test('Should handle invalid MongoDB ObjectId format', async () => {
		const invalidId = 'not-a-valid-object-id';

		const res = await request(app).get(`/cabs/${invalidId}`);

		expect(res.statusCode).toBe(404);
		expect(res.body.success).toBe(false);
		expect(res.body).toHaveProperty('error');
	});

	// Test 11: Create new cab - Protected route for drivers
	test('Should create a new cab when authenticated as driver', async () => {
		const { user: driver, token } = await createUserAndGetToken({
			role: 'driver',
		});

		const cabData = {
			vehicleType: 'car',
			vehicleModel: 'Honda City',
			vehicleNumber: 'XYZ789',
			capacity: 4,
			pricePerKm: 12,
			currentLocation: {
				type: 'Point',
				coordinates: [77.209, 28.6139], // Delhi coordinates
				address: 'Delhi, India',
			},
		};

		const res = await request(app)
			.post('/cabs')
			.set('Authorization', `Bearer ${token}`)
			.send(cabData);

		expect(res.statusCode).toBe(201);
		expect(res.body.success).toBe(true);
		expect(res.body.data.vehicleNumber).toBe(cabData.vehicleNumber);
		expect(res.body.data.driver).toBe(driver._id.toString());
		expect(res.body.data.currentLocation.coordinates).toEqual(
			cabData.currentLocation.coordinates
		);
	});

	// Test 12: Create cab - Unauthorized without token
	test('Should reject cab creation without authentication token', async () => {
		const cabData = {
			vehicleType: 'car',
			vehicleModel: 'Honda City',
			vehicleNumber: 'XYZ789',
			capacity: 4,
			pricePerKm: 12,
		};

		const res = await request(app).post('/cabs').send(cabData);

		expect(res.statusCode).toBe(401);
		expect(res.body.success).toBe(false);
		expect(res.body).toHaveProperty('error');
	});

	// Test 13: Prevent creating cab with duplicate vehicle number
	test('Should prevent creating cab with duplicate vehicle number', async () => {
		const { user: driver, token } = await createUserAndGetToken({
			role: 'driver',
		});

		await createCab(driver._id, { vehicleNumber: 'DUP123' });
		const cabData = {
			vehicleType: 'car',
			vehicleModel: 'Honda City',
			vehicleNumber: 'DUP123', // Duplicate
			capacity: 4,
			pricePerKm: 12,
		};

		const res = await request(app)
			.post('/cabs')
			.set('Authorization', `Bearer ${token}`)
			.send(cabData);

		expect(res.statusCode).toBe(400);
		expect(res.body.success).toBe(false);
		expect(res.body).toHaveProperty('error');
	});

	// Test 14: Reject cab creation for unauthorized roles
	test('Should reject cab creation for non-driver users', async () => {
		const { token } = await createUserAndGetToken({ role: 'user' });
		const cabData = {
			vehicleType: 'car',
			vehicleModel: 'Honda City',
			vehicleNumber: 'XYZ789',
			capacity: 4,
			pricePerKm: 12,
		};

		const res = await request(app)
			.post('/cabs')
			.set('Authorization', `Bearer ${token}`)
			.send(cabData);

		expect(res.statusCode).toBe(403);
		expect(res.body.success).toBe(false);
		expect(res.body).toHaveProperty('error');
	});

	// Test 15: Validate required fields for cab creation
	test('Should validate required fields for cab creation', async () => {
		const { token } = await createUserAndGetToken({ role: 'driver' });
		const incompleteCabData = {
			vehicleType: 'car',
		};

		const res = await request(app)
			.post('/cabs')
			.set('Authorization', `Bearer ${token}`)
			.send(incompleteCabData);

		expect(res.statusCode).toBe(400);
		expect(res.body.success).toBe(false);
	});

	// Test 16: Validate enum values for vehicleType
	test('Should validate enum values for vehicleType', async () => {
		const { token } = await createUserAndGetToken({ role: 'driver' });

		const cabData = {
			vehicleType: 'spaceship', // Not in enum ('car', 'bike', 'auto')
			vehicleModel: 'Honda City',
			vehicleNumber: 'XYZ789',
			capacity: 4,
			pricePerKm: 12,
		};

		const res = await request(app)
			.post('/cabs')
			.set('Authorization', `Bearer ${token}`)
			.send(cabData);

		expect(res.statusCode).toBe(400);
		expect(res.body.success).toBe(false);
	});

	// Test 17: Update cab - Owner only
	test('Should allow owner to update their cab', async () => {
		const { user: driver, token } = await createUserAndGetToken({
			role: 'driver',
		});

		const cab = await createCab(driver._id);
		const updateData = {
			pricePerKm: 15,
			isAvailable: false,
		};

		const res = await request(app)
			.put(`/cabs/${cab._id}`)
			.set('Authorization', `Bearer ${token}`)
			.send(updateData);

		expect(res.statusCode).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data.pricePerKm).toBe(updateData.pricePerKm);
		expect(res.body.data.isAvailable).toBe(updateData.isAvailable);
		expect(res.body.data.vehicleNumber).toBe(cab.vehicleNumber);
	});

	// Test 18: Prevent non-owner from updating cab
	test('Should prevent non-owner from updating cab', async () => {
		const { user: driver1 } = await createUserAndGetToken({
			name: 'Driver 1',
			email: 'driver1@example.com',
			role: 'driver',
		});
		const { token: driver2Token } = await createUserAndGetToken({
			name: 'Driver 2',
			email: 'driver2@example.com',
			role: 'driver',
		});

		const cab = await createCab(driver1._id);
		const updateData = {
			pricePerKm: 15,
			isAvailable: false,
		};
		const res = await request(app)
			.put(`/cabs/${cab._id}`)
			.set('Authorization', `Bearer ${driver2Token}`)
			.send(updateData);

		expect(res.statusCode).toBe(401);
		expect(res.body.success).toBe(false);
	});

	// Test 19: Update cab - Non-existent cab
	test('Should return 404 when updating non-existent cab', async () => {
		const { token } = await createUserAndGetToken({ role: 'driver' });
		const nonExistentId = new mongoose.Types.ObjectId();
		const updateData = {
			pricePerKm: 15,
		};

		const res = await request(app)
			.put(`/cabs/${nonExistentId}`)
			.set('Authorization', `Bearer ${token}`)
			.send(updateData);

		expect(res.statusCode).toBe(404);
		expect(res.body.success).toBe(false);
	});

	// Test 20: Filter cabs by location proximity
	test('Should filter cabs by location proximity', async () => {
		const driver = await User.create({
			name: 'Test Driver',
			email: 'driver@example.com',
			password: 'password123',
			role: 'driver',
		});

		await createCab(driver._id, {
			vehicleNumber: 'CAB001',
			currentLocation: {
				type: 'Point',
				coordinates: [72.8777, 19.076],
			},
		});

		await createCab(driver._id, {
			vehicleNumber: 'CAB002',
			currentLocation: {
				type: 'Point',
				coordinates: [77.209, 28.6139],
			},
		});

		await createCab(driver._id, {
			vehicleNumber: 'CAB003',
			currentLocation: {
				type: 'Point',
				coordinates: [72.8856, 19.0822],
			},
		});

		const res = await request(app).get(
			'/cabs?lat=19.0760&lng=72.8777&maxDistance=5'
		);

		expect(res.statusCode).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.count).toBe(2);
		expect(res.body.data.some((cab) => cab.vehicleNumber === 'CAB002')).toBe(
			false
		);
	});

	// Test 21: Location filter with invalid coordinates
	test('Should handle invalid location coordinates gracefully', async () => {
		const driver = await User.create({
			name: 'Test Driver',
			email: 'driver@example.com',
			password: 'password123',
			role: 'driver',
		});

		await createCab(driver._id, { vehicleNumber: 'CAB001' });

		// Search with invalid coordinates
		const res = await request(app).get(
			'/cabs?lat=invalid&lng=invalid&maxDistance=5'
		);

		expect(res.statusCode).not.toBe(500);
		expect([200, 400, 404]).toContain(res.statusCode);
	});

	// Test 22: Partial location parameters
	test('Should handle partial location parameters', async () => {
		const driver = await User.create({
			name: 'Test Driver',
			email: 'driver@example.com',
			password: 'password123',
			role: 'driver',
		});

		await createCab(driver._id);
		const res = await request(app).get('/cabs?lat=19.0760&maxDistance=5');

		expect(res.statusCode).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.count).toBe(1);
	});

	// Test 23: Empty database - should handle gracefully
	test('Should handle empty database gracefully', async () => {
		const res = await request(app).get('/cabs');
		expect(res.statusCode).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.count).toBe(0);
		expect(Array.isArray(res.body.data)).toBe(true);
		expect(res.body.data.length).toBe(0);
	});
});
