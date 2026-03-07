import { Request, Response } from "express";
import { CategoryService } from "./category.service";
import { CategoryRepository } from "./category.repository";

export async function create(req: Request, res: Response) {
  const { name, parentId, active } = req.body;

  const category = await CategoryService.create({
    name,
    parentId: parentId ?? null,
    active: active ?? true,
  });

  res.status(201).json(category);
}

export async function createHierarchy(req: Request, res: Response) {
  const { rootCategoryId, levels } = req.body;

  const result = await CategoryService.createHierarchy({
    rootCategoryId: Number(rootCategoryId),
    levels,
  });

  res.status(201).json(result);
}

export async function getTree(req: Request, res: Response) {
  const tree = await CategoryService.findTree();
  res.json(tree);
}

export async function getChildren(req: Request, res: Response) {
  const parentId =
    req.params.id === "root"
      ? null
      : Number(req.params.id);

  const result = await CategoryService.findChildren(parentId);
  res.json(result);
}

export async function getSubtree(req: Request, res: Response) {
  const id = Number(req.params.id);
  const subtree = await CategoryService.findSubtree(id);

  res.json(subtree);
}

export async function getById(req: Request, res: Response) {
  const id = Number(req.params.id);
  const category = await CategoryRepository.findById(id);

  if (!category) {
    return res
      .status(404)
      .json({ message: "Categoría no encontrada" });
  }

  res.json(category);
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);

  const updated = await CategoryRepository.update(
    id,
    req.body
  );

  res.json(updated);
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);

  await CategoryService.remove(id);

  res.status(204).send();
}

export async function toggleCategoryActive(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { active } = req.body;

  await CategoryService.toggleActive(
    id,
    Boolean(active)
  );

  res.json({ message: "Estado actualizado" });
}

export async function importCategories(req: Request, res: Response) {
  const { paths } = req.body;

  await CategoryRepository.importFromPaths(paths);

  res.status(201).json({ message: "Importación exitosa" });
}