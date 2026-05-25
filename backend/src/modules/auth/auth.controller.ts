import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { TenantService } from "../tenant/tenant.service";
import { AuthError } from "./auth";

export async function login(req: Request, res: Response) {
  try {
    const { username, password, slug } = req.body;

    const tenantId = await TenantService.resolveSlug(slug);

    const result = await AuthService.login({
      username,
      password,
      tenantId,
    });

    return res.status(200).json(result);

  } catch (err: any) {

    if (err.message === AuthError.INVALID_CREDENTIALS) {
      return res.status(401).json({
        message: "Usuario o contraseña incorrectos",
      });
    }

    if (err.message === "TENANT_NOT_FOUND") {
      return res.status(404).json({
        message: "Empresa no encontrada",
      });
    }

    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
}

export async function logout(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }
  const token = authHeader.split(" ")[1];

  await AuthService.logout(token);

  return res.json({ message: "Logout exitoso" });
}

export async function logoutGlobal(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado" });
  }

  await AuthService.logoutGlobal(req.user.id);

  return res.json({
    message: "Sesiones cerradas en todos los dispositivos",
  });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token requerido" });
  }

  const tokens = await AuthService.rotateRefreshToken(refreshToken);

  return res.json(tokens);
}