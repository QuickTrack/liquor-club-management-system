/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let details = null;

  // Handle known error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    code = 'VALIDATION_ERROR';
    details = formatValidationErrors(err);
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    code = 'INVALID_ID';
  } else if (err.code === 11000) { // MongoDB duplicate key
    statusCode = 409;
    message = 'Duplicate entry';
    code = 'DUPLICATE_ENTRY';
    details = getDuplicateKeyMessage(err);
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = err.message || 'Unauthorized';
    code = 'UNAUTHORIZED';
  } else if (err.isOperational) {
    statusCode = err.statusCode || 500;
    message = err.message;
    code = err.code || 'OPERATIONAL_ERROR';
    details = err.details;
  }

  // Custom error handling from our app
  if (err.statusCode) {
    statusCode = err.statusCode;
  }
  if (err.message) {
    message = err.message;
  }
  if (err.code) {
    code = err.code;
  }
  if (err.details) {
    details = err.details;
  }

  // Log error
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  console.log(`[${logLevel.toUpperCase()}] ${code}: ${message}`);

  // Send error response
  const errorResponse = {
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  if (details) {
    errorResponse.details = details;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Format Mongoose validation errors into readable format
 */
const formatValidationErrors = (err) => {
  const errors = {};

  for (const field in err.errors) {
    errors[field] = {
      message: err.errors[field].message,
      kind: err.errors[field].kind,
      value: err.errors[field].value,
    };
  }

  return errors;
};

/**
 * Extract duplicate key message from MongoDB error
 */
const getDuplicateKeyMessage = (err) => {
  const match = err.message.match(/\$([a-zA-Z_]+)_/);
  const field = match ? match[1] : null;

  return {
    field,
    message: `A ${field || 'record'} with this value already exists`,
  };
};

/**
 * Custom error class for operational errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default errorHandler;
