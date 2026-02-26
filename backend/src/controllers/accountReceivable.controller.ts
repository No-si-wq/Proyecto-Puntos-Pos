import { Request, Response, NextFunction } from "express";
import { accountReceivableService } from "../services/accountReceivable.service";
import { Prisma } from "@prisma/client";

export const createReceivable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await accountReceivableService.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

export const listReceivables = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await accountReceivableService.list(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getReceivable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await accountReceivableService.findById(
      Number(req.params.id)
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const registerReceivablePayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { amount, note } = req.body;

    const data =
      await accountReceivableService.registerPayment(
        Number(req.params.id),
        new Prisma.Decimal(amount),
        note
      );

    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const customerSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data =
      await accountReceivableService.summaryByCustomer(
        Number(req.params.customerId)
      );
    res.json(data);
  } catch (error) {
    next(error);
  }
};