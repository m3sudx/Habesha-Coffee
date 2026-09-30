import {Router} from 'express'
import { validate,registerValidation,loginValidation } from '../middleware/validate.js'
import { register,login,me } from '../controllers/auth.controller.js'
import requireAuth from '../middleware/auth.js'

const authRoute=Router()

authRoute.post('/register', validate(registerValidation), register)
authRoute.post('/login', validate(loginValidation), login)
authRoute.get('/me', requireAuth, me)


export default authRoute

