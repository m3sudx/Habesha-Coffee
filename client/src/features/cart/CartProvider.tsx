"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import * as cartApi from "@/lib/api/cart";
import type { Cart } from "@/lib/api/cart";

const SESSION_KEY = "habesha.cart-session"; // the guest cart id
const CODE_KEY = "habesha.discount-code"; // the discount code the shopper applied

export type AppliedDiscount = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  discountCents: number;
  totalCents: number;
};

type CartContextValue = {
  cart: Cart;
  ready: boolean; // false until the first load has finished
  itemCount: number;
  discount: AppliedDiscount | null;
  addItem: (variantId: string, quantity: number) => Promise<void>;
  setQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  applyDiscount: (code: string) => Promise<void>;
  removeDiscount: () => void;
  refresh: () => Promise<void>; // reload the cart from the server
};

const CartContext = createContext<CartContextValue | null>(null);

const EMPTY_CART: Cart = { id: null, items: [], itemCount: 0, subtotalCents: 0 };

// Browser storage can be blocked, so never let it crash the app.
function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string | null) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status, token } = useAuth();
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [ready, setReady] = useState(false);
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null);

  const identity = useCallback(
    (): cartApi.CartIdentity => ({ token, sessionId: readStored(SESSION_KEY) }),
    [token],
  );

  // Works out what the saved discount code is worth for this cart. If the code
  // stopped being valid (expired, used up, cart emptied), it is dropped.
  const resolveDiscount = useCallback(
    async (current: Cart): Promise<AppliedDiscount | null> => {
      const code = readStored(CODE_KEY);
      if (!code) return null;
      if (current.subtotalCents === 0) {
        writeStored(CODE_KEY, null);
        return null;
      }
      try {
        const res = await cartApi.validateDiscount(identity(), code);
        return {
          code: res.data.code,
          type: res.data.type,
          value: res.data.value,
          discountCents: res.data.discountCents,
          totalCents: res.data.totalCents,
        };
      } catch {
        writeStored(CODE_KEY, null);
        return null;
      }
    },
    [identity],
  );

  // Stores a fresh cart (and its discount) in state in one go.
  const apply = useCallback(
    async (next: Cart) => {
      const nextDiscount = await resolveDiscount(next);
      setCart(next);
      setDiscount(nextDiscount);
    },
    [resolveDiscount],
  );

  // Load the cart on page load, and again whenever the user logs in or out.
  useEffect(() => {
    if (status === "loading") return;
    let cancelled = false;

    async function load() {
      try {
        let loaded: Cart = EMPTY_CART;
        const sessionId = readStored(SESSION_KEY);

        if (status === "authenticated" && token) {
          if (sessionId) {
            // The shopper had a guest cart before logging in: move it into the account cart.
            try {
              await cartApi.mergeCart(token, sessionId);
              writeStored(SESSION_KEY, null);
            } catch {
              // Keep the guest id so the merge is tried again next time.
            }
          }
          loaded = (await cartApi.getCart({ token, sessionId: null })).data;
        } else if (sessionId) {
          loaded = (await cartApi.getCart({ token: null, sessionId })).data;
        }

        const resolved = await resolveDiscount(loaded);
        if (cancelled) return;
        setCart(loaded);
        setDiscount(resolved);
      } catch {
        if (cancelled) return;
        setCart(EMPTY_CART);
        setDiscount(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // resolveDiscount only changes together with token, which is already listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, token]);

  const addItem = useCallback(
    async (variantId: string, quantity: number) => {
      // Guests get a cart id the first time they add something.
      if (!token && !readStored(SESSION_KEY)) writeStored(SESSION_KEY, crypto.randomUUID());
      const res = await cartApi.addItem(identity(), variantId, quantity);
      await apply(res.data);
    },
    [token, identity, apply],
  );

  const setQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      const res = await cartApi.setItemQuantity(identity(), variantId, quantity);
      await apply(res.data);
    },
    [identity, apply],
  );

  const removeItem = useCallback(
    async (variantId: string) => {
      const res = await cartApi.removeItem(identity(), variantId);
      await apply(res.data);
    },
    [identity, apply],
  );

  // Throws the backend's message (for example "Invalid or expired discount code") if the code is rejected.
  const applyDiscount = useCallback(
    async (code: string) => {
      const res = await cartApi.validateDiscount(identity(), code);
      writeStored(CODE_KEY, res.data.code);
      setDiscount({
        code: res.data.code,
        type: res.data.type,
        value: res.data.value,
        discountCents: res.data.discountCents,
        totalCents: res.data.totalCents,
      });
    },
    [identity],
  );

  const removeDiscount = useCallback(() => {
    writeStored(CODE_KEY, null);
    setDiscount(null);
  }, []);

  // Used after a payment, when the server has emptied the cart.
  const refresh = useCallback(async () => {
    try {
      const sessionId = readStored(SESSION_KEY);
      if (!token && !sessionId) return;
      const res = await cartApi.getCart({ token, sessionId });
      await apply(res.data);
    } catch {
      // keep what is shown
    }
  }, [token, apply]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      ready,
      itemCount: cart.itemCount,
      discount,
      addItem,
      setQuantity,
      removeItem,
      applyDiscount,
      removeDiscount,
      refresh,
    }),
    [cart, ready, discount, addItem, setQuantity, removeItem, applyDiscount, removeDiscount, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
