export interface Supplier {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  rtn: string;
  active: boolean;
  createdAt: string;
}

export interface CreateSupplierDTO {
  name: string;
  email?: string;
  phone?: string;
  rtn: string;
}

export interface UpdateSupplierDTO {
  name?: string;
  email?: string;
  phone?: string;
  rtn?: string;
  active?: boolean;
}