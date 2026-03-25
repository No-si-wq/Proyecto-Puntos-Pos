import { Request, Response } from "express";
import { CustomerService } from "./customer.service";

export async function listCustomers(req: Request, res: Response) {

  const search =
    typeof req.query.search === "string"
      ? req.query.search
      : undefined;

  const customers = await CustomerService.list({ search });
  res.json(customers);
}

export async function getCustomer(req: Request, res: Response) {
  const id = Number(req.params.id);
  const customer = await CustomerService.getById(id);

  if (!customer) {
    return res.status(404).json({ message: "Cliente no encontrado" });
  }

  res.json(customer);
}

export async function createCustomer(req: Request, res: Response) {

  const customer = await CustomerService.create(req.body);

  res.status(201).json(customer);
}

export async function updateCustomer(req: Request, res: Response) {
  const id = Number(req.params.id);
  const customer = await CustomerService.update(id, req.body);

  res.json(customer);
}

export async function toggleCustomerActive(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { active } = req.body;

  await CustomerService.toggleActive(id, Boolean(active));

  res.json({ message: "Estado actualizado" });
}