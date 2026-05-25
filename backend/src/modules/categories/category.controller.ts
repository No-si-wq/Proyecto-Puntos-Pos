import { Request, Response } from "express";
import { CategoryService } from "./category.service";

export async function create(req: Request, res: Response) {
  const { name, parentId, active } = req.body;
  const { tenantId } = req.user!;

  const category = await CategoryService.create({
    tenantId,
    name,
    parentId: parentId ?? null,
    active: active ?? true,
  });

  res.status(201).json(category);
}

export async function createHierarchy(req: Request, res: Response) {
  const { rootCategoryId, levels } = req.body;
  const { tenantId } = req.user!;

  const result = await CategoryService.createHierarchy({
    tenantId,
    rootCategoryId: Number(rootCategoryId),
    levels,
  });

  res.status(201).json(result);
}

export async function getTree(req: Request, res: Response) {
  const { tenantId } = req.user!;
  const tree = await CategoryService.findTree(tenantId);
  res.json(tree);
}

export async function getChildren(req: Request, res: Response) {
  const { tenantId } = req.user!;
  const parentId =
    req.params.id === "root"
      ? null
      : Number(req.params.id);

  const result = await CategoryService.findChildren(parentId, tenantId);
  res.json(result);
}

export async function getSubtree(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const subtree = await CategoryService.findSubtree(id, tenantId);

  res.json(subtree);
}

export async function getById(req: Request, res: Response) {
  const { tenantId } = req.user!;
  const id = Number(req.params.id);

  const category = await CategoryService.findById(id, tenantId);

  if (!category) {
    return res
      .status(404)
      .json({ message: "Categoría no encontrada" });
  }

  res.json(category);
}

export async function update(req: Request, res: Response) {
  const { tenantId } = req.user!;
  const id = Number(req.params.id);

  const updated = await CategoryService.update(
    id,
    tenantId,
    req.body
  );

  res.json(updated);
}

export async function toggleCategoryActive(req: Request, res: Response) {
  const { tenantId } = req.user!;
  const id = Number(req.params.id);
  const { active } = req.body;

  await CategoryService.toggleActive(
    id,
    tenantId,
    Boolean(active)
  );

  res.json({ message: "Estado actualizado" });
}

export async function importCategories(req: Request, res: Response) {
  const { tenantId } = req.user!;
  const { paths } = req.body;

  await CategoryService.importFromPaths(tenantId ,paths);

  res.status(201).json({
    message: "Importación exitosa",
  });
}