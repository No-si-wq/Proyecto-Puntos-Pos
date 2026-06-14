export interface Customer {
  id: number;
  name: string;
  dni: string;
  email?: string;
  phone?: string;
  direction?: string;
  active: boolean;
  createdAt?: string;
  creditLimit?: number | null;
  points?: {
    balance: number;
  } | null;
}

export interface CustomerSearch {
  search?: string,
  onlyInactive?: boolean,
};

export interface CreateCustomerDTO {
  name: string;
  email?: string;
  phone?: string;
  direction?: string;
  creditLimit?: number | null;
}

export interface UpdateCustomerDTO {
  name?: string;
  email?: string;
  phone?: string;
  direction?: string;
  creditLimit?: number | null;
  active?: boolean;
}