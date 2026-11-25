import type { RequestHandler } from "express";
import { getValidated } from "../../middleware/validate.js";
import type { ProductIdParams } from "./admin-product.schema.js";
import { removeProductImage, setProductImage } from "./admin-product-image.service.js";

// uploadProductImage (multer) runs before this and puts the file on req.file.
export const uploadImageHandler: RequestHandler = async (req, res) => {
  const { id } = getValidated<ProductIdParams>(res, "params");
  const product = await setProductImage(id, req.file);

  res.status(200).json({ success: true, data: product });
};

export const removeImageHandler: RequestHandler = async (_req, res) => {
  const { id } = getValidated<ProductIdParams>(res, "params");
  const product = await removeProductImage(id);

  res.status(200).json({ success: true, data: product });
};