import { body, validationResult,param,header,query } from 'express-validator';
import ApiError from '../utils/ApiError.js';


export const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validation rules for this request
    for (const validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) break; // Stop at the first error chain
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const firstErrorMessage = errors.array()[0].msg;
    return next(new ApiError(400, firstErrorMessage));
  };
};

// 3. Registration Validations
export const registerValidation = [
  // Full Name
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be between 2 and 60 characters')
    .matches(/^[a-zA-Z\s.'-]+$/).withMessage('Name can only contain letters, spaces, hyphens, and dots')
    .escape(),

  // Email format & normalization
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please provide a valid email address (e.g. user@example.com)')
    .isLength({ max: 255 }).withMessage('Email address is too long')
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      all_lowercase: true,
    }),

  // Strong Password
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 72 }).withMessage('Password must be between 6 and 72 characters')
    .matches(/[A-Z]/).withMessage('Password must include at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must include at least one number')
    .not().matches(/\s/).withMessage('Password must not contain spaces'),
];

// 4. Login Validations
export const loginValidation = [
  // Email
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      all_lowercase: true,
    }),

  // Password
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ max: 72 }).withMessage('Password cannot exceed 72 characters'),
];


export const addCartItemValidation = [
  body('variantId').isInt({ min: 1 }).withMessage('variantId must be a positive whole number').toInt(),
  body('quantity').isInt({ min: 1, max: 20 }).withMessage('quantity must be between 1 and 20').toInt(),
];


const itemId = param('itemId')
  .isInt({ min: 1, max: 2147483647 })
  .withMessage('Invalid cart item id')
  .toInt();

export const itemIdValidation = [itemId];

export const updateCartItemValidation = [
  itemId,
  body('quantity').isInt({ min: 1, max: 20 }).withMessage('quantity must be between 1 and 20').toInt(),
];

export const mergeCartValidation = [
  header('x-cart-session').isUUID().withMessage('A valid X-Cart-Session header is required'),
];


export const discountCodeValidation = [
  body('code')
    .trim()
    .notEmpty().withMessage('Discount code is required')
    .isLength({ max: 30 }).withMessage('Invalid discount code'),
];


export const checkoutValidation = [
  body('shipping.name').trim().notEmpty().withMessage('Shipping name is required')
    .isLength({ max: 100 }).withMessage('Shipping name is too long'),
  body('shipping.phone').optional({ values: 'falsy' }).trim()
    .isLength({ max: 30 }).withMessage('Phone number is too long'),
  body('shipping.address').trim().notEmpty().withMessage('Shipping address is required')
    .isLength({ max: 200 }).withMessage('Shipping address is too long'),
  body('shipping.city').trim().notEmpty().withMessage('City is required')
    .isLength({ max: 100 }).withMessage('City is too long'),
  body('shipping.country').trim().notEmpty().withMessage('Country is required')
    .isLength({ max: 100 }).withMessage('Country is too long'),
  body('discountCode').optional({ values: 'falsy' }).trim()
    .isLength({ max: 30 }).withMessage('Invalid discount code'),
];


export const orderIdValidation = [
  param('id').isInt({ min: 1, max: 2147483647 }).withMessage('Invalid order id').toInt(),
];

export const ordersListValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be 1 or more').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50').toInt(),
];


export const adminOrdersValidation = [
  query('status').optional().isIn(['pending', 'paid', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search text is too long'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be 1 or more').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50').toInt(),
];

export const orderStatusValidation = [
  param('id').isInt({ min: 1, max: 2147483647 }).withMessage('Invalid order id').toInt(),
  body('status').isIn(['shipped', 'delivered', 'cancelled']).withMessage('status must be shipped, delivered or cancelled'),
];



// ---------- Admin: products ----------
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const productId = param('id').isInt({ min: 1, max: 2147483647 }).withMessage('Invalid product id').toInt();

// create: name and roast are required. update: every field is optional.
const productBodyRules = (isCreate) => {
  const required = (chain) => (isCreate ? chain : chain.optional());
  return [
    required(body('name')).trim().notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('slug').optional().trim().toLowerCase()
      .matches(SLUG).withMessage('Slug can only contain lowercase letters, numbers and hyphens')
      .isLength({ max: 120 }).withMessage('Slug is too long'),
    body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description is too long'),
    body('origin').optional().trim().isLength({ max: 100 }).withMessage('Origin is too long'),
    required(body('roast')).notEmpty().withMessage('Roast is required')
      .isIn(['light', 'medium', 'dark']).withMessage('Roast must be light, medium or dark'),
    body('tastingNotes').optional().trim().isLength({ max: 300 }).withMessage('Tasting notes are too long'),
    body('categoryId').optional().isInt({ min: 1, max: 2147483647 }).withMessage('Invalid category id').toInt(),
    body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
  ];
};

export const productIdValidation = [productId];
export const createProductValidation = productBodyRules(true);
export const updateProductValidation = [productId, ...productBodyRules(false)];
export const adminProductsListValidation = [
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search text is too long'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be 1 or more').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50').toInt(),
];