import { body, validationResult } from 'express-validator';
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