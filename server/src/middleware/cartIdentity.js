import ApiError from '../utils/ApiError.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Decides WHO owns the cart: the logged-in user, or the guest session
export default function cartIdentity(req, res, next) {
  if (req.user) {
    req.cartOwner = { userId: req.user.id, sessionId: null };
    return next();
  }

  const sessionId = req.headers['x-cart-session'];
  if (!sessionId || !UUID.test(sessionId)) {
    throw new ApiError(400, 'Login or a valid X-Cart-Session header is required');
  }

  req.cartOwner = { userId: null, sessionId };
  next();
}