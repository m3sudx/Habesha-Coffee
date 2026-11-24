import { Router } from "express";
import authRouter from '../modules/auth/auth.route.js'
import catalogRouter from '../modules/catalog/catalog.route.js'
import cartRouter from '../modules/cart/cart.route.js'
import discountRouter from '../modules/discount/discount.route.js'
import orderRouter from '../modules/order/order.route.js'
const router=Router()

router.use('/auth',authRouter)
router.use('/',catalogRouter)
router.use('/cart', cartRouter)
router.use('/discounts', discountRouter)
router.use('/orders', orderRouter)

export default router 