import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { productQuerySchema, productSlugParamsSchema } from "./catalog.schema.js";
import { getCategories, getProduct, getProducts } from "./catalog.controller.js";

const router = Router();

router.get("/categories", getCategories);
router.get("/products", validate(productQuerySchema, "query"), getProducts);
router.get("/products/:slug", validate(productSlugParamsSchema, "params"), getProduct);

export default router;