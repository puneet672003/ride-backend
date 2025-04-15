const errorHandler = (err, req, res, next) => {
	if (err.name === 'CastError') {
		const message = `Resource not found`;
		return res.status(404).json({ success: false, error: message });
	}

	if (err.name === 'ValidationError') {
		const message = Object.values(err.errors).map((val) => val.message);
		return res.status(400).json({ success: false, error: message });
	}

	if (err.code === 11000) {
		const message = 'Duplicate field value entered';
		return res.status(400).json({ success: false, error: message });
	}

	if (err.name === 'JsonWebTokenError') {
		return res.status(401).json({ success: false, error: 'Invalid token' });
	}

	if (err.name === 'TokenExpiredError') {
		return res.status(401).json({ success: false, error: 'Token expired' });
	}

	let statusCode = 500;
	if (res.statusCode) statusCode = res.statusCode;

	res.status(statusCode).json({
		success: false,
		error: err.message || 'Server Error',
	});
};

export default errorHandler;
