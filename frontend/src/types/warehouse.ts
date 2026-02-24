export interface Warehouse {
  id: number;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseFormValues {
  name: string;
  active?: boolean;
}