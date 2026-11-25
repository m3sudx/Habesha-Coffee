import type { RequestHandler } from "express";
import multer from "multer";
import { MAX_IMAGE_BYTES } from "../config/uploads.js";
import { AppError } from "../utils/error.js";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// The file is kept in memory (at most 2 MB), so nothing is written to disk until the
// service has checked the real file type and the product exists.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 5 },
  // The mimetype is only what the client claims: a quick first filter.
  // The service checks the real bytes.
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new AppError("Only JPEG, PNG or WebP images are allowed", 400));
      return;
    }
    cb(null, true);
  },
});

// Expects exactly one file in the form-data field "image".
// Multer's own errors are turned into normal AppErrors so the client gets clean JSON.
export const uploadProductImage: RequestHandler = (req, res, next) => {
  upload.single("image")(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        next(new AppError(`The image is too large (maximum ${MAX_IMAGE_BYTES / 1024 / 1024} MB)`, 413));
        return;
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        next(new AppError('Send the file in a form-data field named "image"', 400));
        return;
      }
      next(new AppError(`Upload failed: ${err.message}`, 400));
      return;
    }

    next(err);
  });
};