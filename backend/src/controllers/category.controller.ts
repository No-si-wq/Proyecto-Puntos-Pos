import { Request, Response } from "express";
import { CategoryService } from "../services/category.service";
import { CategoryRepository } from "../services/category.repository";

export async function create(req: Request, res: Response) {
  try {
    const { name, parentId, active } = req.body;

    const category = await CategoryService.create({
      name,
      parentId: parentId ?? null,
      active: active ?? true,
    });

    res.status(201).json(category);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function createHierarchy(req: Request, res: Response) {
  try {
    const { rootCategoryId, levels } = req.body;

    const result = await CategoryService.createHierarchy({
      rootCategoryId: Number(rootCategoryId),
      levels,
    });

    res.status(201).json(result);
  } catch (error: any) {
    if (error.message === "EMPTY_LEVELS") {
      return res.status(400).json({ message: "Niveles vacíos" });
    }

    if (error.message === "ROOT_NOT_FOUND") {
      return res.status(404).json({ message: "Categoría raíz no válida" });
    }

    res.status(400).json({ message: error.message });
  }
}

export async function getTree(req: Request, res: Response) {
  try {
    const tree = await CategoryService.findTree();
    res.json(tree);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getChildren(req: Request, res: Response) {
  try {
    const parentId =
      req.params.id === "root"
        ? null
        : Number(req.params.id);

    const result = await CategoryService.findChildren(parentId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function getSubtree(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const subtree = await CategoryService.findSubtree(id);

    res.json(subtree);
  } catch (error: any) {
    if (error.message === "CATEGORY_NOT_FOUND") {
      return res.status(404).json({
        message: "Categoría no encontrada",
      });
    }

    res.status(400).json({ message: error.message });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const category = await CategoryRepository.findById(id);

    if (!category) {
      return res
        .status(404)
        .json({ message: "Categoría no encontrada" });
    }

    res.json(category);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const updated = await CategoryRepository.update(
      id,
      req.body
    );

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    await CategoryService.remove(id);

    res.status(204).send();
  } catch (error: any) {
    if (error.message === "CATEGORY_HAS_CHILDREN") {
      return res.status(400).json({
        message:
          "No se puede eliminar una categoría con subcategorías activas",
      });
    }

    res.status(400).json({ message: error.message });
  }
}

export async function toggleCategoryActive(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);
    const { active } = req.body;

    await CategoryService.toggleActive(
      id,
      Boolean(active)
    );

    res.json({ message: "Estado actualizado" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function importCategories(req: Request, res: Response) {
  try {
    const { paths } = req.body;

    await CategoryRepository.importFromPaths(paths);

    res.status(201).json({ message: "Importación exitosa" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}