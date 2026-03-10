export interface CommissionLevel {
  id: number;
  name: string;
  description?: string | null;
  active: boolean;
  _count?: { commissions: number };
}

export interface SalesCommission {
  id: number;
  userId: number;
  levelId: number;
  percent: number;
  user?: { id: number; name: string | null; username: string };
  level: CommissionLevel;
}

export interface CommissionLevelDetail extends CommissionLevel {
  commissions: SalesCommission[];
}

export interface CreateCommissionLevelDto {
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