import Router from 'express';

import {
	createOrder,
	getOrders,
	getOrder,
	updateOrderStatus,
	updateOrderLocation,
	trackOrder,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middlewares/auth.js';

const orderRouter = Router();

orderRouter
	.route('/')
	.post(protect, authorize('user'), createOrder)
	.get(protect, getOrders);

orderRouter
	.route('/:id')
	.get(protect, getOrder)
	.put(protect, authorize('driver'), updateOrderStatus);

orderRouter
	.route('/:id/track')
	.get(protect, trackOrder)
	.put(protect, authorize('driver'), updateOrderLocation);

export default orderRouter;
