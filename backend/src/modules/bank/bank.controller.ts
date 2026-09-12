import { Request, Response } from "express";
import { bankService } from "./bank.service";
import { Prisma } from "@prisma/client";

export const createBank = async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const data = await bankService.create({ ...req.body, tenantId });
  res.status(201).json(data);
};

export const listBanks = async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const data = await bankService.list(req.query, tenantId);
  res.json(data);
};

export const getBank = async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const data = await bankService.findById(Number(req.params.id), tenantId);
  res.json(data);
};

export const updateBank = async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const data = await bankService.update(
    Number(req.params.id),
    tenantId,
    req.body
  );
  res.json(data);
};

export const toggleBank = async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const data = await bankService.update(Number(req.params.id), tenantId, {
    active: req.body.active,
  });
  res.json(data);
};

export const createBankMovement = async (req: Request, res: Response) => {
  const { tenantId, id: userId } = req.user!;
  const { type, amount, description } = req.body;

  const data = await bankService.createMovement(
    tenantId,
    Number(req.params.id),
    { type, amount: new Prisma.Decimal(amount), description },
    userId
  );

  res.status(201).json(data);
};

export const createBankTransfer = async (req: Request, res: Response) => {
  const { tenantId, id: userId } = req.user!;
  const { fromBankId, toBankId, amount, description } = req.body;

  const data = await bankService.transfer(
    tenantId,
    {
      fromBankId,
      toBankId,
      amount: new Prisma.Decimal(amount),
      description,
    },
    userId
  );

  res.status(201).json(data);
};

export const listBankTransactions = async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const data = await bankService.listTransactions(tenantId, req.query);
  res.json(data);
};

export const reconcileBankTransactions = async (
  req: Request,
  res: Response
) => {
  const { tenantId } = req.user!;
  const data = await bankService.reconcile(
    tenantId,
    req.body.transactionIds
  );
  res.json(data);
};

export const bankSummary = async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const data = await bankService.summary(tenantId);
  res.json(data);
};

export const getBankStatement = async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const bankId = Number(req.params.id);
  const { from, to } = req.query;

  const data = await bankService.getBankStatement(
    tenantId,
    bankId,
    new Date(from as string),
    new Date(to as string)
  );

  res.json(data);
};