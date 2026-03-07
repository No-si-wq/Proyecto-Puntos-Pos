import { Request, Response } from "express";
import { accountReceivableService } from "./accountReceivable.service";
import { Prisma } from "@prisma/client";

export const createReceivable = async (req: Request, res: Response) => {
  const data = await accountReceivableService.create(req.body);
  res.status(201).json(data);
};

export const listReceivables = async (req: Request, res: Response) => {
  const data = await accountReceivableService.list(req.query);
  res.json(data);
};

export const getReceivable = async (req: Request, res: Response ) => {
  const data = await accountReceivableService.findById(
    Number(req.params.id)
  );
  res.json(data);
};

export const registerReceivablePayment = async (req: Request, res: Response) => {
  const { amount, note } = req.body;

  const data =
    await accountReceivableService.registerPayment(
      Number(req.params.id),
      new Prisma.Decimal(amount),
      note
    );

  res.json(data);
};

export const customerSummary = async ( req: Request, res: Response) => {
  const data =
    await accountReceivableService.summaryByCustomer(
      Number(req.params.customerId)
    );
  res.json(data);
};