export interface PriceList {
  id: number;
  name: string;
  description?: string | null;
  active: boolean;
  _count?: { prices: number };
}

export interface ProductPrice {
  id: number;
  productId: number;
  priceListId: number;
  price: number;
  active: boolean;
  product?: { id: number; name: string; sku: string; price: number };
  priceList: { id: number; name: string; active: boolean };
}

export interface PriceListDetail extends PriceList {
  prices: ProductPrice[];
}

export interface CreatePriceListDto {
  name: string;
  description?: string;
  active?: boolean;
}

export interface UpdatePriceListDto {
  name?: string;
  description?: string;
  active?: boolean;
}

export interface UpsertProductPriceDto {
  productId: number;
  price: number;
}

export interface BulkUpsertProductPricesDto {
  prices: UpsertProductPriceDto[];
}