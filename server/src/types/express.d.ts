export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
