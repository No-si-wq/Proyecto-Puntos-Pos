import { Request, Response } from "express";
import { SupplierService } from "../services/supplier.service";
import { SupplierError } from "../types/supplier";

export async function listSuppliers(req: Request, res: Response) {
  const suppliers = await SupplierService.list();
  res.json(suppliers);
}

export async function getSupplier(req: Request, res: Response) {
  const supplier = await SupplierService.getById(Number(req.params.id));

  if (!supplier) {
    return res.status(404).json({ message: "Proveedor no encontrado" });
  }

  res.json(supplier);
}

export async function createSupplier(req: Request, res: Response) {
  try {
    const supplier = await SupplierService.create(req.body);
    res.status(201).json(supplier);
  } catch (e) {
    res.status(400).json({ message: "Datos inválidos" });
  }
}

export async function updateSupplier(req: Request, res: Response) {
  try {
    const supplier = await SupplierService.update(
      Number(req.params.id),
      req.body
    );
    res.json(supplier);
  } catch (e) {
    res.status(400).json({ message: "Error actualizando proveedor" });
  }
}