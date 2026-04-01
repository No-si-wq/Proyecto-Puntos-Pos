export interface Warehouse {
  id: number;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWareHouseDTO {
  name: string;
}

export interface UpdateWareHouseDTO {
  name?: string;
  active?: boolean;
}