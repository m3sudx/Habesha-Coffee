import type { RequestHandler } from "express";
import { AppError } from "../../utils/error.js";
import { getValidated } from "../../middleware/validate.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";
import { loginUser, registerUser } from "./auth.service.js";

export const register: RequestHandler = async (_req, res) => {
  const input = getValidated<RegisterInput>(res);
  const { user, token } = await registerUser(input);

  res.status(201).json({ success: true, data: { user, token } });
};

export const login: RequestHandler = async (_req, res) => {
  const input = getValidated<LoginInput>(res);
  const { user, token } = await loginUser(input);

  res.status(200).json({ success: true, data: { user, token } });
};

export const me: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw new AppError("Not authenticated", 401);
  }

  res.status(200).json({ success: true, data: { user: req.user } });
};