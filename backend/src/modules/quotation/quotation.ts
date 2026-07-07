export interface QuotationItemInput {
  productId: number;
  quantity: number;
  price: number;
  priceListId?: number;
  discountType?: 'NONE' | 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  tax?: number;
}

export interface CreateQuotationInput {
  customerId?: number;
  warehouseId: number;
  priceListId?: number;
  sellerId?: number;
  observations?: string;
  expiresAt?: string;
  items: QuotationItemInput[];
}