import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type TokenPayload = {
  sub: string;
  role: "customer" | "admin";
};

export function signToken(user: { id: string; role: "customer" | "admin" }): string {
  const payload: TokenPayload = { sub: user.id, role: user.role };

  return jwt.sign(payload, env.JWT_SECRET, {
    
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (typeof decoded === "string" || typeof decoded.sub !== "string") {
    throw new Error("Malformed token payload");
  }

  return decoded as unknown as TokenPayload;
}