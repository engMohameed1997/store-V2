"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { getJson, postJson, deleteJson, putJson } from "@/lib/client/api";
import { toast } from "sonner";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    nameAr: string | null;
    slug: string;
    price: number | string;
    stock: number;
    images: { url: string; alt: string | null }[];
  };
  variant: {
    id: string;
    name: string;
    price: number | string;
  } | null;
}

interface Cart {
  id: string;
  items: CartItem[];
}

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    nameAr: string | null;
    slug: string;
    price: number | string;
    compareAtPrice: number | string | null;
    stock: number;
    images: { url: string; alt: string | null }[];
    brand: { name: string } | null;
  };
}

interface CartWishlistContextValue {
  cart: Cart | null;
  wishlist: WishlistItem[];
  cartCount: number;
  wishlistCount: number;
  isLoading: boolean;
  isInWishlist: (productId: string) => boolean;
  addToCart: (productId: string, quantity?: number, variantId?: string) => Promise<boolean>;
  removeItemFromCart: (itemId: string) => Promise<boolean>;
  updateCartItemQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  refreshCart: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const CartWishlistContext = createContext<CartWishlistContextValue | null>(null);

export function CartWishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, accessToken, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setCart(null);
      return;
    }
    const res = await getJson<Cart>("/api/v1/cart", { token: accessToken });
    if (res.success && res.data) {
      setCart(res.data as Cart);
    }
  }, [isAuthenticated, accessToken]);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setWishlist([]);
      return;
    }
    const res = await getJson<WishlistItem[]>("/api/v1/wishlist", { token: accessToken });
    if (res.success && res.data) {
      setWishlist(res.data as WishlistItem[]);
    }
  }, [isAuthenticated, accessToken]);

  // Initial load or auth status change
  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated && accessToken) {
      setLoading(true);
      Promise.all([refreshCart(), refreshWishlist()]).finally(() => {
        setLoading(false);
      });
    } else {
      setCart(null);
      setWishlist([]);
      setLoading(false);
    }
  }, [isAuthenticated, accessToken, authLoading, refreshCart, refreshWishlist]);

  const cartCount = useMemo(() => {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const wishlistCount = useMemo(() => {
    return wishlist.length;
  }, [wishlist]);

  const isInWishlist = useCallback(
    (productId: string) => {
      return wishlist.some((item) => item.product.id === productId);
    },
    [wishlist]
  );

  const addToCart = useCallback(
    async (productId: string, quantity = 1, variantId?: string) => {
      if (!isAuthenticated || !accessToken) {
        toast.error("يرجى تسجيل الدخول أولاً للإضافة إلى السلة");
        return false;
      }

      const res = await postJson<unknown>(
        "/api/v1/cart",
        { productId, quantity, variantId },
        { token: accessToken }
      );

      if (res.success) {
        toast.success("تمت الإضافة إلى السلة");
        await refreshCart();
        return true;
      } else {
        toast.error(!res.success ? res.error.message : "حدث خطأ أثناء الإضافة للسلة");
        return false;
      }
    },
    [isAuthenticated, accessToken, refreshCart]
  );

  const removeItemFromCart = useCallback(
    async (itemId: string) => {
      if (!isAuthenticated || !accessToken) return false;

      const res = await deleteJson<unknown>(`/api/v1/cart/${itemId}`, { token: accessToken });

      if (res.success) {
        toast.success("تم الحذف من السلة");
        await refreshCart();
        return true;
      } else {
        toast.error("حدث خطأ أثناء الحذف من السلة");
        return false;
      }
    },
    [isAuthenticated, accessToken, refreshCart]
  );

  const updateCartItemQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!isAuthenticated || !accessToken) return false;

      const res = await putJson<unknown>(
        `/api/v1/cart/${itemId}`,
        { quantity },
        { token: accessToken }
      );

      if (res.success) {
        await refreshCart();
        return true;
      } else {
        toast.error("حدث خطأ أثناء تحديث الكمية");
        return false;
      }
    },
    [isAuthenticated, accessToken, refreshCart]
  );

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!isAuthenticated || !accessToken) {
        toast.error("يرجى تسجيل الدخول أولاً لإضافة المنتج للمفضلة");
        return false;
      }

      const res = await postJson<{ added: boolean }>(
        "/api/v1/wishlist",
        { productId },
        { token: accessToken }
      );

      if (res.success && res.data) {
        if (res.data.added) {
          toast.success("تمت الإضافة إلى المفضلة");
        } else {
          toast.success("تم الحذف من المفضلة");
        }
        await refreshWishlist();
        return true;
      } else {
        toast.error(!res.success ? res.error.message : "حدث خطأ أثناء تحديث المفضلة");
        return false;
      }
    },
    [isAuthenticated, accessToken, refreshWishlist]
  );

  const value = useMemo(
    () => ({
      cart,
      wishlist,
      cartCount,
      wishlistCount,
      isLoading: loading || authLoading,
      isInWishlist,
      addToCart,
      removeItemFromCart,
      updateCartItemQuantity,
      toggleWishlist,
      refreshCart,
      refreshWishlist,
    }),
    [
      cart,
      wishlist,
      cartCount,
      wishlistCount,
      loading,
      authLoading,
      isInWishlist,
      addToCart,
      removeItemFromCart,
      updateCartItemQuantity,
      toggleWishlist,
      refreshCart,
      refreshWishlist,
    ]
  );

  return (
    <CartWishlistContext.Provider value={value}>
      {children}
    </CartWishlistContext.Provider>
  );
}

export function useCartWishlist() {
  const context = useContext(CartWishlistContext);
  if (!context) {
    throw new Error("useCartWishlist must be used within a CartWishlistProvider");
  }
  return context;
}
