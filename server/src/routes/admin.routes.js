import { Router } from 'express';
import {requireAuth} from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import { validate, adminOrdersValidation, orderIdValidation, orderStatusValidation } from '../middleware/validate.js';
import { listAllOrders, getAnyOrder, changeOrderStatus } from '../controllers/admin.controller.js';

const adminRoute = Router();

// Everything below needs a login AND the admin role
adminRoute.use(requireAuth, requireRole('admin'));

adminRoute.get('/orders', validate(adminOrdersValidation), listAllOrders);
adminRoute.get('/orders/:id', validate(orderIdValidation), getAnyOrder);
adminRoute.patch('/orders/:id/status', validate(orderStatusValidation), changeOrderStatus);

export default adminRoute;