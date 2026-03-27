export interface FiltersCustomers {
  search?: string,
  onlyInactive?: boolean,
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  dni: string;
  active: boolean;
  createdAt?: string;
  points?: {
    balance: number;
  } | null;
}

export interface CreateCustomerDTO {
  name: string;
  email?: string;
  phone?: string;
  dni: string;
}

export interface UpdateCustomerDTO {
  name?: string;
  email?: string;
  phone?: string;
  dni?: string;
  active?: boolean;
}