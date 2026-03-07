import { Request, Response } from "express";
import { importProductsFromExcel } from "./product.import";
import { ProductService } from "./product.service";
import { promises as fs } from "fs";


export async function importProducts(req: Request, res: Response) {

  if (!req.file) {
    return res.status(400).json({
      message: "Archivo requerido",
    });
  }

  const filePath = req.file.path;

  try {

    const result = await importProductsFromExcel(filePath);

    return res.json({
      message: "Productos importados correctamente",
      inserted: result.count ?? result,
    });

  } catch (error: any) {

    return res.status(400).json({
      message: error.message ?? "Error al importar productos",
    });

  } finally {

    // siempre eliminar el archivo temporal
    await fs.unlink(filePath).catch(() => {});

  }
}

export async function listProducts(req: Request, res: Response) {
  const data = await ProductService.listGlobal();
  return res.json(data);
}

export async function getProductsByWarehouse(req: Request, res: Response) {
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

export async function getProductByBarcode(req: Request, res: Response) {
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
}

export async function toggleProductActive(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { active } = req.body;

  await ProductService.toggleActive(id, Boolean(active));
  res.json({ message: "Estado actualizado" });
}
