import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "../../config/db.js";
import { PRODUCT_IMAGES_DIR, PRODUCT_IMAGES_URL_PREFIX } from "../../config/uploads.js";
import { AppError } from "../../utils/error.js";
import { getAdminProduct } from "./admin-product.service.js";

type ImageType = "jpg" | "png" | "webp";

// Identifies the real file type from its first bytes ("magic bytes"), because the file name
// and the Content-Type header are chosen by the client and can be faked.
function detectImageType(buf: Buffer): ImageType | null {
  // JPEG: FF D8 FF
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "jpg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "png";
  }
  // WebP: "RIFF" .... "WEBP"
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return "webp";
  }
  return null;
}

// Deletes the file behind a stored image URL. Best effort: a missing file or a failure here
// must never fail the request. It only touches files inside our own folder, so an admin who
// pasted an external URL (or a strange path) into imageUrl can never delete anything else.
async function removeStoredFile(imageUrl: string | null): Promise<void> {
  if (!imageUrl || !imageUrl.startsWith(`${PRODUCT_IMAGES_URL_PREFIX}/`)) return;

  try {
    await unlink(path.join(PRODUCT_IMAGES_DIR, path.basename(imageUrl)));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("Could not delete old product image:", err);
    }
  }
}

async function getCurrentImageUrl(productId: string): Promise<string | null> {
  const { rows } = await pool.query<{ image_url: string | null }>(
    "SELECT image_url FROM products WHERE id = $1",
    [productId],
  );
  if (!rows[0]) {
    throw new AppError("Product not found", 404);
  }
  return rows[0].image_url;
}

export async function setProductImage(productId: string, file: Express.Multer.File | undefined) {
  if (!file) {
    throw new AppError('No image received. Send it in a form-data field named "image".', 400);
  }

  const type = detectImageType(file.buffer);
  if (!type) {
    throw new AppError("The file is not a valid JPEG, PNG or WebP image", 400);
  }

  // Check the product exists BEFORE writing anything to disk.
  const oldImageUrl = await getCurrentImageUrl(productId);

  const fileName = `${randomUUID()}.${type}`;
  const newImageUrl = `${PRODUCT_IMAGES_URL_PREFIX}/${fileName}`;

  await mkdir(PRODUCT_IMAGES_DIR, { recursive: true });
  await writeFile(path.join(PRODUCT_IMAGES_DIR, fileName), file.buffer);

  try {
    await pool.query("UPDATE products SET image_url = $1 WHERE id = $2", [newImageUrl, productId]);
  } catch (err) {
    // Don't leave an orphan file behind if the database update failed.
    await removeStoredFile(newImageUrl);
    throw err;
  }

  await removeStoredFile(oldImageUrl);
  return getAdminProduct(productId);
}

export async function removeProductImage(productId: string) {
  const oldImageUrl = await getCurrentImageUrl(productId);

  await pool.query("UPDATE products SET image_url = NULL WHERE id = $1", [productId]);
  await removeStoredFile(oldImageUrl);

  return getAdminProduct(productId);
}