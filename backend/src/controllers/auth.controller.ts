import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    const result = await AuthService.login({ username, password });

    return res.json(result);
  } catch (error) {
    if ((error as Error).message === "INVALID_CREDENTIALS") {
      return res.status(401).json({
        message: "Credenciales inválidas",
      });
    }

    console.error("Login error:", error);
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
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token requerido" });
    }

    const tokens = await AuthService.rotateRefreshToken(refreshToken);

    return res.json(tokens);
  } catch (error) {
    if ((error as Error).message === "REFRESH_TOKEN_REUSE") {
      return res.status(401).json({
        message: "Sesión comprometida. Inicie sesión nuevamente.",
      });
    }

    return res.status(401).json({ message: "Refresh token inválido" });
  }
}