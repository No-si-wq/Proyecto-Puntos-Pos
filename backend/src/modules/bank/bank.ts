export type BankTransactionKind =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "TRANSFER_IN"
  | "TRANSFER_OUT";

export interface BankBase {
  name: string;
  bankName?: string;
  accountNumber?: string;
  accountType?: string;
  currency?: string;
}

export type CreateBankInput = BankBase;

export type UpdateBankInput = Partial<BankBase> & {
  active?: boolean;
};

export interface BankMovementInput {
  type: "DEPOSIT" | "WITHDRAWAL";
  amount: number;
  description?: string;
}

export interface BankTransferInput {
  fromBankId: number;
  toBankId: number;
  amount: number;
  description?: string;
}

export interface BankReconcileInput {
  transactionIds: number[];
}

export interface BankSummary {
  totalBalance: number;
  banks: {
    id: number;
    name: string;
    balance: number;
  }[];
}

export enum BankError {
  DUPLICATE_BANK = "DUPLICATE_BANK",
  BANK_NOT_FOUND = "BANK_NOT_FOUND",
  BANK_INACTIVE = "BANK_INACTIVE",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  SAME_BANK_TRANSFER = "SAME_BANK_TRANSFER",
}