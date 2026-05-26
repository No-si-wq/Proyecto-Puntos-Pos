import { Request, Response } from "express";
import { SupplierService } from "./supplier.service";

export async function listSuppliers(req: Request, res: Response) {
  const search =
    typeof req.query.search === "string"
      ? req.query.search
      : undefined;

  const onlyInactive = req.query.onlyInactive === "true";

  const { tenantId } = req.user!;

  const suppliers = await SupplierService.list({
    tenantId,
    search,
    onlyInactive,
  });
  res.json(suppliers);
}

export async function getSupplier(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const supplier = await SupplierService.getById(id, tenantId);

  if (!supplier) {
    return res.status(404).json({ message: "Proveedor no encontrado" });
  }

  res.json(supplier);
}

export async function createSupplier(req: Request, res: Response) {
  const { tenantId } = req.user!;
  const supplier = await SupplierService.create(req.body, tenantId);
  res.status(201).json(supplier);
}

export async function updateSupplier(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const supplier = await SupplierService.update(
    id,
    req.body,
    tenantId,
  );
  res.json(supplier);
}

export async function toggleSupplierActive(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const { active } = req.body;

  await SupplierService.toggleActive(id, tenantId, Boolean(active));

  res.json({ message: "Estado actualizado" });
}