import type { RequestHandler, Response } from "express";
import type { ZodType } from "zod";

type RequestSource = "body" | "params" | "query";

export function validate(
  schema: ZodType,
  source: RequestSource = "body",
): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join(".") || source,
          message: issue.message,
        })),
      });
      return;
    }

    res.locals.validated = {
      ...res.locals.validated,
      [source]: result.data,
    };

    next();
  };
}
export function getValidated<T>(res: Response, source: RequestSource = "body"): T {
  return res.locals.validated?.[source] as T;
}