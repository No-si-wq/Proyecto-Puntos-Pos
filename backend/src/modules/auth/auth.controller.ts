import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;

  const result = await AuthService.login({ username, password });

  return res.json(result);
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