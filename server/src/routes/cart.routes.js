import { Router } from 'express';
import { optionalAuth,requireAuth } from '../middleware/auth.js';
import cartIdentity from '../middleware/cartIdentity.js';
import { cart,addItem,updateItem,deleteItem,clearCart,mergeCart } from '../controllers/cart.controller.js';
import {mergeCartValidation,itemIdValidation,updateCartItemValidation,addCartItemValidation ,validate} from '../middleware/validate.js';

const cartRoute = Router();

cartRoute.post('/merge', requireAuth, validate(mergeCartValidation), mergeCart);

cartRoute.use(optionalAuth, cartIdentity); // runs for every cart route
cartRoute.get('/', cart);
cartRoute.post('/items', validate(addCartItemValidation), addItem);
cartRoute.patch('/items/:itemId', validate(updateCartItemValidation), updateItem);
cartRoute.delete('/items/:itemId', validate(itemIdValidation), deleteItem);
cartRoute.delete('/', clearCart);

export default cartRoute;