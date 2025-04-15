import { config } from 'dotenv';

config();

export const PORT = process.env.PORT || 5000;
export const MONGO_URI =
	process.env.MONGO_URI || 'mongodb://localhost:27017/ride-hailing-app';
export const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
export const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';
