export interface CommissionLevel {
  id: number;
  name: string;
  active: boolean;
  description?: string | null;
  priceListId?: number | null;
  priceList?: { id: number; name: string } | null;
  commissions?: SalesCommission[];
  _count?: { commissions: number };
}

export interface SalesCommission {
  id: number;
  userId: number;
  levelId: number;
  percent: number;
  active: boolean;
  level?: CommissionLevel;
  user?: {
    id: number;
    name: string | null;
    username: string;
  };
}

export interface CreateCommissionLevelDto {
  name: string;
  description?: string;
  priceListId?: number | null;
}

export interface UpdateCommissionLevelDto {
  name?: string;
  description?: string;
  priceListId?: number | null;
}

export interface AssignCommissionDto {
  userId: number;
  levelId: number;
  percent: number;
}

export interface UpdateCommissionDto {
  percent: number;
}