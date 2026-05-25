import prisma from "../prisma";
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token requerido" });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        tenantId: true,
        username: true,
        role: true,
        active: true,
        tokenVersionAt: true,
      },
    });

    if (!user || !user.active) {
      return res.status(401).json({ message: "Usuario no autorizado" });
    }

    if (user.tenantId !== payload.tenantId) {
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    const tokenIssuedAt = new Date(payload.iat * 1000);

    if (tokenIssuedAt < user.tokenVersionAt) {
      return res.status(401).json({
        message: "Sesión invalidada. Inicie sesión nuevamente.",
      });
    }

    req.user = {
      id: user.id,
      tenantId: user.tenantId,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}