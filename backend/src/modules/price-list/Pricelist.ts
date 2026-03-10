export interface PriceList {
  id: number;
  name: string;
  description?: string | null;
  active: boolean;
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