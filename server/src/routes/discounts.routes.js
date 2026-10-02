import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import cartIdentity from '../middleware/cartIdentity.js';
import { validate, discountCodeValidation } from '../middleware/validate.js';
import { validateDiscount } from '../controllers/discounts.controller.js';

const discountsRoute = Router();

discountsRoute.use(optionalAuth, cartIdentity);
discountsRoute.post('/validate', validate(discountCodeValidation), validateDiscount);

export default discountsRoute;