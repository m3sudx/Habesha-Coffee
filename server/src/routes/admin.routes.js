import { Router } from 'express';
import {requireAuth} from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import { validate, adminOrdersValidation, orderIdValidation, orderStatusValidation } from '../middleware/validate.js';
import { listAllOrders, getAnyOrder, changeOrderStatus } from '../controllers/admin.controller.js';
import { listProducts,addProduct,getProduct,editProduct,removeProduct } from '../controllers/adminProducts.controller.js';

const adminRoute = Router();

// Everything below needs a login AND the admin role
adminRoute.use(requireAuth, requireRole('admin'));

adminRoute.get('/orders', validate(adminOrdersValidation), listAllOrders);
adminRoute.get('/orders/:id', validate(orderIdValidation), getAnyOrder);
adminRoute.patch('/orders/:id/status', validate(orderStatusValidation), changeOrderStatus);
adminRoute.get('/products', validate(adminProductsListValidation), listProducts);
adminRoute.post('/products', validate(createProductValidation), addProduct);
adminRoute.get('/products/:id', validate(productIdValidation), getProduct);
adminRoute.patch('/products/:id', validate(updateProductValidation), editProduct);
adminRoute.delete('/products/:id', validate(productIdValidation), removeProduct);
export default adminRoute;