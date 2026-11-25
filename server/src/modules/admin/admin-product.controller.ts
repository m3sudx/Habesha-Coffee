import type { RequestHandler } from "express";
import { getValidated } from "../../middleware/validate.js";
import type {
  AdminProductListQuery,
  CreateProductInput,
  CreateVariantInput,
  ProductIdParams,
  ProductVariantParams,
  UpdateProductInput,
  UpdateVariantInput,
} from "./admin-product.schema.js";
import {
  createProduct,
  createVariant,
  getAdminProduct,
  listAdminProducts,
  updateProduct,
  updateVariant,
} from "./admin-product.service.js";

export const listProductsHandler: RequestHandler = async (_req, res) => {
  const query = getValidated<AdminProductListQuery>(res, "query");
  const { items, pagination } = await listAdminProducts(query);

  res.status(200).json({ success: true, data: items, pagination });
};

export const getProductHandler: RequestHandler = async (_req, res) => {
  const { id } = getValidated<ProductIdParams>(res, "params");
  const product = await getAdminProduct(id);

  res.status(200).json({ success: true, data: product });
};

export const createProductHandler: RequestHandler = async (_req, res) => {
  const input = getValidated<CreateProductInput>(res);
  const product = await createProduct(input);

  res.status(201).json({ success: true, data: product });
};

export const updateProductHandler: RequestHandler = async (_req, res) => {
  const { id } = getValidated<ProductIdParams>(res, "params");
  const input = getValidated<UpdateProductInput>(res);
  const product = await updateProduct(id, input);

  res.status(200).json({ success: true, data: product });
};

// Variant writes return the whole product, so a UI can refresh in one step.
export const createVariantHandler: RequestHandler = async (_req, res) => {
  const { id } = getValidated<ProductIdParams>(res, "params");
  const input = getValidated<CreateVariantInput>(res);
  const product = await createVariant(id, input);

  res.status(201).json({ success: true, data: product });
};

export const updateVariantHandler: RequestHandler = async (_req, res) => {
  const { id, variantId } = getValidated<ProductVariantParams>(res, "params");
  const input = getValidated<UpdateVariantInput>(res);
  const product = await updateVariant(id, variantId, input);

  res.status(200).json({ success: true, data: product });
};