import { Request, Response } from "express";
import { UserService } from "../services/user.service";

export async function listUsers(req: Request, res: Response) {
  const users = await UserService.list();
  res.json(users);
}

export async function getUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  const user = await UserService.getById(id);

  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  res.json(user);
}

export async function createUser(req: Request, res: Response) {
  const { email, name, password, role, username } = req.body;

  const user = await UserService.create({
    email,
    name,
    username,
    password,
    role,
  });

  res.status(201).json(user);
}

export async function updateUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  const user = await UserService.update(id, req.body);

  res.json(user);
}

export async function toggleUserActive(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { active } = req.body;

  await UserService.toggleActive(id, Boolean(active));

  res.json({ message: "Estado actualizado" });
}

export async function logoutUserAll(req: Request, res: Response) {
  const id = Number(req.params.id);

  await UserService.forceLogoutAll(id);

  res.json({ message: "Sesiones cerradas" });
}