import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";

export function roleMiddleware(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Usuario no autenticado",
      });
    }

    const { role } = req.user;

    if (!allowedRoles.includes(role)) {
      return res.status(404).end();
    }

    next();
  };
}