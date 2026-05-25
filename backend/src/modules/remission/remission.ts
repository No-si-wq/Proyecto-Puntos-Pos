export interface RemissionItemDto {
  productId: number;
  quantity: number;
  note?: string;
}

export interface CreateRemissionDto {
  warehouseId: number;
  customerName?: string;
  note?: string;
  items: RemissionItemDto[];
}

export enum RemissionError {
  WAREHOUSE_NOT_FOUND     = 'REMISSION_WAREHOUSE_NOT_FOUND',
  INVALID_PRODUCT         = 'REMISSION_INVALID_PRODUCT',
  NOT_FOUND               = 'REMISSION_NOT_FOUND',
  ALREADY_CANCELLED       = 'REMISSION_ALREADY_CANCELLED',
  NOT_PENDING             = 'REMISSION_NOT_PENDING',
}