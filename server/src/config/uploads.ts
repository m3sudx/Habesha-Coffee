import path from "node:path";

// Resolved from where the server is started (the server/ folder), so run npm scripts from there.
export const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
export const PRODUCT_IMAGES_DIR = path.join(UPLOADS_DIR, "products");

// The public URL path stored in the database (the frontend adds the API's address in front).
export const PRODUCT_IMAGES_URL_PREFIX = "/uploads/products";

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB