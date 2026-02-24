import { Request, Response } from "express";
import { ProductService } from "../services/product.service";

export async function listProducts(req: Request, res: Response) {
  const data = await ProductService.listGlobal();
  return res.json(data);
}

export async function getProductsByWarehouse(
  req: Request,
  res: Response
) {
  const warehouseId = (req as any).warehouseId;

  if (!warehouseId) {
    return res.status(400).json({
      message: "Almacén no seleccionado",
    });
  }

  const data =
    await ProductService.getByWarehouse(warehouseId);

  res.json(data);
}

export async function getProduct(req: Request, res: Response) {
  const id = Number(req.params.id);
  const product = await ProductService.getById(id);

  if (!product) {
    return res.status(404).json({ message: "Producto no encontrado" });
  }

  res.json(product);
}

export async function createProduct(req: Request, res: Response) {
  const product = await ProductService.create(req.body);
  res.status(201).json(product);
}

export async function updateProduct(req: Request, res: Response) {
  const id = Number(req.params.id);
  const product = await ProductService.update(id, req.body);
  res.json(product);
}

export async function getProductByBarcode(
  req: Request,
  res: Response
) {
  try {
    const code = req.query.code;

    if (typeof code !== "string") {
      return res.status(400).json({ error: "Invalid barcode" });
    }

    const product = await ProductService.getByBarcode(code);

    if (!product) {
      return res.status(404).json({
        error: "Producto no encontrado",
      });
    }

    return res.json(product);
  } catch (error) {
    console.error("getProductByBarcode:", error);

    return res.status(500).json({
      error: "Error al buscar producto por código de barras",
    });
  }
}

export async function toggleProductActive(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { active } = req.body;

  await ProductService.toggleActive(id, Boolean(active));
  res.json({ message: "Estado actualizado" });
}

