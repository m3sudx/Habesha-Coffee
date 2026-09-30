import ApiError from '../utils/ApiError.js';

function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    err = new ApiError(400, 'Request body is not valid JSON');
  }
  if (!err.isOperational) console.error(err); // log real bugs

  const statusCode = err.isOperational ? err.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : 'Internal server error',
  });
}
export default errorHandler;