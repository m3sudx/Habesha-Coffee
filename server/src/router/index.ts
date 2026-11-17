import { Router } from "express";
import authRouter from '../modules/auth/auth.route.js'
import catalogRouter from '../modules/catalog/catalog.route.js'
const router=Router()

router.use('/auth',authRouter)
router.use('/',catalogRouter)


export default router 