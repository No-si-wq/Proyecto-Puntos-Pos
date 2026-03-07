import { Request, Response } from "express";
import { accountPayableService } from "./accountPayable.service";
import { Prisma } from "@prisma/client";

export const createPayable = async (req: Request, res: Response) => {
  const data = await accountPayableService.create(req.body);
  res.status(201).json(data);
};

export const listPayables = async (req: Request, res: Response) => {
  const data = await accountPayableService.list(req.query);
  res.json(data);
};

export const registerPayablePayment = async (req: Request, res: Response) => {
  const { amount, note } = req.body;

  const data =
    await accountPayableService.registerPayment(
      Number(req.params.id),
      new Prisma.Decimal(amount),
      note
    );

  res.json(data);
};