import cors from 'cors';
import express from 'express';

import { connectDB } from './config/db.js';

connectDB();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// adding routes and middlewares -----
import userRouter from './routes/userRoutes.js';
import cabRouter from './routes/cabRoutes.js';
import orderRouter from './routes/orderRoutes.js';
import errorHandler from './middlewares/error.js';

app.use('/users', userRouter);
app.use('/cabs', cabRouter);
app.use('/orders', orderRouter);
app.use(errorHandler);

export default app;
