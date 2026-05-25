export type QuotationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';
export type DiscountType = 'NONE' | 'PERCENTAGE' | 'FIXED';

export interface QuotationItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  discountType: DiscountType; 
  discountValue: number;        
  discountAmount: number;
  lineSubtotal: number;
  taxAmount: number;
  tax: number;                 
  lineTotal: number;
  product: { id: number; name: string; sku: string };
}

export interface Quotation {
  id: number;
  quotationNumber: string;
  status: QuotationStatus;
  subtotal: number;
  discount: number;          
  total: number;
  taxTotal: number;
  observations?: string;
  expiresAt?: string;
  createdAt: string;
  customer?: { id: number; name: string, phone: string, direction: string, dni: string };
  user: { id: number; name: string };
  seller?: { id: number; name: string };    
  priceList?: { id: number; name: string }; 
  warehouse: { id: number; name: string };
  convertedSale?: { id: number; saleNumber: string };
  items: QuotationItem[];
}

export interface QuotationItemInput {
  productId: number;
  quantity: number;
  price: number;
  discountType?: DiscountType;
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