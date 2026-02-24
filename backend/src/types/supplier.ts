export type SupplierEmail = string;
export type SupplierPhone = string;

export interface SupplierBase {
  name: string;
  email?: SupplierEmail;
  phone?: SupplierPhone;
}

export type CreateSupplierInput = SupplierBase;

export type UpdateSupplierInput = Partial<SupplierBase> & {
  active?: boolean;
};

export enum SupplierError {
  SUPPLIER_NOT_FOUND = "SUPPLIER_NOT_FOUND",
  DUPLICATE_SUPPLIER = "DUPLICATE_SUPPLIER",
  INVALID_SUPPLIER = "INVALID_SUPPLIER",
}