import express from 'express'
import authRoute from './auth.routes.js'
import categoriesRoute from './categories.routes.js'
import productsRoute from './products.routes.js'
const mainRouter=express.Router()
 
mainRouter.use('/auth',authRoute)
mainRouter.use('/categories',categoriesRoute)
mainRouter.use('/products',productsRoute)

export default mainRouter