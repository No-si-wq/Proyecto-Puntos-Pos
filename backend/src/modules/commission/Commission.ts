export interface CommissionLevel {
  id: number;
  name: string;
  active: boolean;
  description?: string | null;
  commissions?: SalesCommission[];
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

export interface CreateCommissionLevelDto  {
  name: string;
  description?: string;
}

export interface UpdateCommissionLevelDto {
  name?: string;
  description?: string;
}

export interface AssignCommissionDto {
  userId: number;
  levelId: number;
  percent: number;
}

export interface UpdateCommissionDto {
  percent: number;
}