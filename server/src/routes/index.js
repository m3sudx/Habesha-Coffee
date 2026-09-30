import express from 'express'
import authRoute from './auth.routes.js'
const mainRouter=express.Router()
 
mainRouter.use('/auth',authRoute)

export default mainRouter