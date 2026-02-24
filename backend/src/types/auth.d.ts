import { Role } from "../types/roles";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: Role;
      };
    }
  }
}

export {};