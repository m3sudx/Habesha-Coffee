import { Router } from 'express';
import {requireAuth} from '../middleware/auth.js';
import { validate, checkoutValidation } from '../middleware/validate.js';
import { startCheckout } from '../controllers/orders.controller.js';

const ordersRoute = Router();

ordersRoute.use(requireAuth); // every order route needs a login
ordersRoute.post('/checkout', validate(checkoutValidation), startCheckout);
ordersRoute.get('/', validate(ordersListValidation), listMyOrders);
ordersRoute.get('/:id', validate(orderIdValidation), getMyOrder);

export default ordersRoute;