import { Request, Response } from "express";
import { UserService } from "./user.service";

export async function listUsers(req: Request, res: Response) {
  const { tenantId } = req.user!;
  const search =
    typeof req.query.search === "string"
      ? req.query.search
      : undefined;

  const onlyInactive = req.query.onlyInactive === "true";

  const users = await UserService.list({
    tenantId,
    search,
    onlyInactive,
  });
  
  res.json(users);
}

export async function getUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const user = await UserService.getById(id, tenantId);

  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  res.json(user);
}

export async function createUser(req: Request, res: Response) {
  const { tenantId } = req.user!;

  const user = await UserService.create(req.body, tenantId);

  res.status(201).json(user);
}

export async function updateUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const user = await UserService.update(id, req.body, tenantId);

  res.json(user);
}

export async function toggleUserActive(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const { active } = req.body;

  await UserService.toggleActive(id, tenantId, Boolean(active));

  res.json({ message: "Estado actualizado" });
}

export async function logoutUserAll(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;

  await UserService.forceLogoutAll(id, tenantId);

  res.json({ message: "Sesiones cerradas" });
}