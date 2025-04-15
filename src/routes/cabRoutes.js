import { Router } from 'express';

import { protect, authorize } from '../middlewares/auth.js';
import {
	getCabs,
	getCab,
	createCab,
	updateCab,
} from '../controllers/cabController.js';

const cabRouter = Router();

cabRouter.route('/').get(getCabs).post(protect, authorize('driver'), createCab);

cabRouter
	.route('/:id')
	.get(getCab)
	.put(protect, authorize('driver'), updateCab);

export default cabRouter;
