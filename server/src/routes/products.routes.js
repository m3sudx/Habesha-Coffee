
import { Router } from "express";
import { getProductBySlug, products } from "../controllers/products.controller.js";

const productsRoute=Router()
productsRoute.get('/',products)
productsRoute.get('/:slug',getProductBySlug)

export default productsRoute