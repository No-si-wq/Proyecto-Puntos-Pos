import { Request, Response } from "express";
import { CustomerService } from "./customer.service";

export async function listCustomers(req: Request, res: Response) {
  const { tenantId } = req.user!;
  const search =
    typeof req.query.search === "string"
      ? req.query.search
      : undefined;

  const onlyInactive = req.query.onlyInactive === "true";

  const customers = await CustomerService.list({
    tenantId,
    search,
    onlyInactive,
  });
  
  res.json(customers);
}

export async function getCustomer(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const customer = await CustomerService.getById(id, tenantId);

  if (!customer) {
    return res.status(404).json({ message: "Cliente no encontrado" });
  }

  res.json(customer);
}

export async function createCustomer(req: Request, res: Response) {
  const { tenantId } = req.user!;

  const customer = await CustomerService.create(req.body, tenantId);

  res.status(201).json(customer);
}

export async function updateCustomer(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const customer = await CustomerService.update(id, tenantId, req.body);

  res.json(customer);
}

export async function toggleCustomerActive(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const { active } = req.body;

  await CustomerService.toggleActive(id, tenantId, Boolean(active));

  res.json({ message: "Estado actualizado" });
}