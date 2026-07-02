import { create } from "zustand";

interface CouponStore {
  couponCode: string | null;
  setCoupon: (code: string) => void;
  clearCoupon: () => void;
}

export const useCouponStore = create<CouponStore>((set) => ({
  couponCode: null,
  setCoupon: (code) => set({ couponCode: code }),
  clearCoupon: () => set({ couponCode: null }),
}));
