export type BankTransactionKind =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "TRANSFER_IN"
  | "TRANSFER_OUT";

export interface Bank {
  id: number;
  name: string;
  bankName?: string | null;
  accountNumber?: string | null;
  accountType?: string | null;
  currency: string;
  balance: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankTransaction {
  id: number;
  bankId: number;
  bank?: Bank;
  type: BankTransactionKind;
  amount: number;
  description?: string | null;
  referenceType?: string | null;
  referenceId?: number | null;
  transferGroupId?: number | null;
  reconciled: boolean;
  reconciledAt?: string | null;
  createdAt: string;
}

export interface CreateBankInput {
  name: string;
  bankName?: string;
  accountNumber?: string;
  accountType?: string;
  currency?: string;
}

export type UpdateBankInput = Partial<CreateBankInput> & {
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