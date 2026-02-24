import { create } from "zustand";

interface SaleState {
  customerId?: number;
  pointsUsed: number;

  setCustomer: (id?: number) => void;
  setPoints: (points: number) => void;
  reset: () => void;
}

export const saleStore = create<SaleState>((set) => ({
  customerId: undefined,
  pointsUsed: 0,

  setCustomer: (id) => set({ customerId: id }),
  setPoints: (points) => set({ pointsUsed: points }),
  reset: () => set({ customerId: undefined, pointsUsed: 0 }),
}));