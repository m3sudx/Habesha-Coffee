import ApiError from '../utils/ApiError.js';

// Use AFTER requireAuth. Example: requireRole('admin')
export default function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Admin access required');
    }
    next();
  };
}