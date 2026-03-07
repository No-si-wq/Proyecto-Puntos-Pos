export type CustomerEmail = string;
export type CustomerPhone = string;

export interface CustomerBase {
  name: string;
  email?: CustomerEmail;
  phone?: CustomerPhone;
}

export type CreateCustomerInput = CustomerBase;

export type UpdateCustomerInput = Partial<CustomerBase> & {
  active?: boolean;
}; 

export enum CustomerError  {
  DUPLICATE_CUSTOMER = "DUPLICATE_CUSTOMER"
}
