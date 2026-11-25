import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";
import {
  adminProductListQuerySchema,
  createProductSchema,
  createVariantSchema,
  productIdParamsSchema,
  productVariantParamsSchema,
  updateProductSchema,
  updateVariantSchema,
} from "./admin-product.schema.js";
import {
  createProductHandler,
  createVariantHandler,
  getProductHandler,
  listProductsHandler,
  updateProductHandler,
  updateVariantHandler,
} from "./admin-product.controller.js";
import { uploadProductImage } from "../../middleware/uploadImage.js";
import { removeImageHandler, uploadImageHandler } from "./admin-product-image.controller.js";
const router = Router();

// Every route in this file is admin only: no token gives 401, a customer gives 403.
router.use(requireAuth, requireRole("admin"));

router.get("/", validate(adminProductListQuerySchema, "query"), listProductsHandler);
router.post("/", validate(createProductSchema), createProductHandler);

router.get("/:id", validate(productIdParamsSchema, "params"), getProductHandler);
router.patch(
  "/:id",
  validate(productIdParamsSchema, "params"),
  validate(updateProductSchema),
  updateProductHandler,
);

router.post(
  "/:id/variants",
  validate(productIdParamsSchema, "params"),
  validate(createVariantSchema),
  createVariantHandler,
);
router.patch(
  "/:id/variants/:variantId",
  validate(productVariantParamsSchema, "params"),
  validate(updateVariantSchema),
  updateVariantHandler,
);

router.post(
  "/:id/image",
  validate(productIdParamsSchema, "params"),
  uploadProductImage,
  uploadImageHandler,
);
router.delete("/:id/image", validate(productIdParamsSchema, "params"), removeImageHandler);

export default router;