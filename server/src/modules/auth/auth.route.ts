import { Router } from "express";
import { register,login, me } from "../auth/auth.controller.js";
import { validate } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { loginSchema, registerSchema } from "./auth.schema.js";
const router = Router();
    
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", requireAuth, me);

export default router;
