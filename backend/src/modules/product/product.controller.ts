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
  const { tenantId } = req.user!;

  try {

    const result = await importProductsFromExcel(filePath, tenantId);

    return res.json({
      message: "Productos importados correctamente",
      inserted: result.count ?? result,
    });

  } catch (error: any) {

    return res.status(400).json({
      message: error.message ?? "Error al importar productos",
    });

  } finally {

    await fs.unlink(filePath).catch(() => {});

  }
}

export async function listProducts(req: Request, res: Response) {
  const { tenantId } = req.user!;
  const search =
    typeof req.query.search === "string"
      ? req.query.search
      : undefined;

  const onlyInactive = req.query.onlyInactive === "true";

  const data = await ProductService.listGlobal({
    tenantId,
    search,
    onlyInactive,
  });
  return res.json(data);
}

export async function getProductsByWarehouse(req: Request, res: Response) {
  const warehouseId = (req as any).warehouseId;
  const { tenantId } = req.user!;

  if (!warehouseId) {
    return res.status(400).json({
      message: "Almacén no seleccionado",
    });
  }

  const data =
    await ProductService.getByWarehouse(warehouseId, tenantId);

  res.json(data);
}

export async function getProduct(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const product = await ProductService.getById(id, tenantId);

  if (!product) {
    return res.status(404).json({ message: "Producto no encontrado" });
  }

  res.json(product);
}

export async function createProduct(req: Request, res: Response) {
  const { tenantId } = req.user!;
  const product = await ProductService.create(req.body, tenantId);
  res.status(201).json(product);
}

export async function updateProduct(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const product = await ProductService.update(id, req.body, tenantId);
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

export async function ProductPrices(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;

  const prices = await ProductService.getPrices(id, tenantId);
  res.json(prices);
}

export async function getProductPrices(req: Request, res: Response) {
  const id = Number(req.params.id)
  const { tenantId } = req.user!;
  const data = await ProductService.getPrices(id, tenantId);
  res.json(data);
}

export async function upsertProductPrice(req: Request, res: Response) {
  const productId   = Number(req.params.id);
  const { priceListId, price } = req.body;
  const { tenantId } = req.user!;
  const data = await ProductService.upsertPrice(productId, tenantId, { priceListId, price });
  res.json(data);
}

export async function ReorderPoint(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const { reorderPoint } = req.body;
  const data = await ProductService.setReorderPoint(id, tenantId, reorderPoint);
  res.json(data);
}

export async function removeProductPrice(req: Request, res: Response) {
  const productId   = Number(req.params.id);
  const priceListId = Number(req.params.priceListId);
  const { tenantId } = req.user!;
  await ProductService.removePrice(productId, priceListId, tenantId);
  res.status(204).send();
}

export async function toggleProductActive(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { active } = req.body;
  const { tenantId } = req.user!;

  await ProductService.toggleActive(id, tenantId, Boolean(active));
  res.json({ message: "Estado actualizado" });
}