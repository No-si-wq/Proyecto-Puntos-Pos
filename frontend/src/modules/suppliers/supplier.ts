export interface Supplier {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  active: boolean;
  createdAt: string;
}

export interface CreateSupplierDTO {
  name: string;
  email?: string;
  phone?: string;
}

export interface SupplierSearch {
  search?: string,
  onlyInactive?: boolean,
};

export interface UpdateSupplierDTO {
  name?: string;
  email?: string;
  phone?: string;
  active?: boolean;
}