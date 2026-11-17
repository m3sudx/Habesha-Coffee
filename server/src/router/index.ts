import { Router } from "express";
import authRouter from '../modules/auth/auth.route.js'
const router=Router()

router.use('/auth',authRouter)


export default router 