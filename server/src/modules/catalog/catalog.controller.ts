import type { RequestHandler } from "express";
import { getValidated } from "../../middleware/validate.js";
import type { ProductQuery, ProductSlugParams } from "./catalog.schema.js";
import {
  getProductBySlug,
  listCategories,
  listProducts,
} from "./catalog.service.js";

export const getCategories: RequestHandler = async (_req, res) => {
  const categories = await listCategories();

  res.status(200).json({ success: true, data: categories });
};

export const getProducts: RequestHandler = async (_req, res) => {
  const query = getValidated<ProductQuery>(res, "query");
  const { items, pagination } = await listProducts(query);

  res.status(200).json({ success: true, data: items, pagination });
};

export const getProduct: RequestHandler = async (_req, res) => {
  const { slug } = getValidated<ProductSlugParams>(res, "params");
  const product = await getProductBySlug(slug);

  res.status(200).json({ success: true, data: product });
};