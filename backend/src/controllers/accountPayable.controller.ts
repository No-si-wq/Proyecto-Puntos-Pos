import { Request, Response, NextFunction } from "express";
import { accountPayableService } from "../services/accountPayable.service";
import { Prisma } from "@prisma/client";

export const createPayable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await accountPayableService.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

export const listPayables = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await accountPayableService.list(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const registerPayablePayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { amount, note } = req.body;

    const data =
      await accountPayableService.registerPayment(
        Number(req.params.id),
        new Prisma.Decimal(amount),
        note
      );

    res.json(data);
  } catch (error) {
    next(error);
  }
};