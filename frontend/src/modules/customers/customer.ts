export interface Customer {
  id: number;
  name: string;
  dni: string;
  email?: string;
  phone?: string;
  direction?: string;
  active: boolean;
  createdAt?: string;
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
}

export interface UpdateCustomerDTO {
  name?: string;
  email?: string;
  phone?: string;
  direction?: string;
  active?: boolean;
}