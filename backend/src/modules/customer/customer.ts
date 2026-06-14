export type CustomerEmail = string;
export type CustomerPhone = string;

export interface CustomerBase {
  name: string;
  dni: string;
  direction?: string;
  email?: CustomerEmail;
  phone?: CustomerPhone;
  creditLimit?: number | null; 
}

export interface CustomerCreditStatus {
  creditLimit: number | null;
  usedCredit: number;
  availableCredit: number | null;
  hasOverdue: boolean;
}

export type CreateCustomerInput = CustomerBase;

export type UpdateCustomerInput = Partial<CustomerBase> & {
  active?: boolean;
}; 

export enum CustomerError  {
  DUPLICATE_CUSTOMER = "DUPLICATE_CUSTOMER",
  CREDIT_LIMIT_EXCEEDED = "CREDIT_LIMIT_EXCEEDED",
}
