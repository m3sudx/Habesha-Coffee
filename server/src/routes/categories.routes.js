import { Router } from "express";
import {categories} from '../controllers/categories.controller.js'

const categoriesRoute=Router()

categoriesRoute.get('/',categories)

export default categoriesRoute