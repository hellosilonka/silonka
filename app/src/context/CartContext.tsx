import React, { createContext, useContext, useState, useCallback } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
  weightKg?: number;   // net product weight in kg (parsed from product.weight string)
  shippingWeightKg?: number;  // gross shipping weight in kg (from product.shippingWeightKg — includes packaging)
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  totalWeightKg: number;   // sum of (weightKg * quantity) for DHL rate calls
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === newItem.id);
      if (existing) {
        return prev.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
    setIsCartOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Use gross shipping weight (shippingWeightKg) for DHL rate calculation;
  // fall back to net content weight (weightKg) or 0.3 kg/unit when neither is set.
  const totalWeightKg = parseFloat(
    items.reduce((sum, item) => sum + (item.shippingWeightKg ?? item.weightKg ?? 0.3) * item.quantity, 0).toFixed(3)
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        totalWeightKg,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
