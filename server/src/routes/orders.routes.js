import { Router } from 'express';
import {requireAuth} from '../middleware/auth.js';
import { validate, checkoutValidation } from '../middleware/validate.js';
import { startCheckout } from '../controllers/orders.controller.js';

const ordersRoute = Router();

ordersRoute.use(requireAuth); // every order route needs a login
ordersRoute.post('/checkout', validate(checkoutValidation), startCheckout);

export default ordersRoute;