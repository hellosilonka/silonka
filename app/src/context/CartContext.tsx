import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { cartKey, CART_STORAGE_KEY, readCart, finishOrder, type CartItem, type CartState } from '@/lib/cart';
export type { CartItem } from '@/lib/cart';
interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string, variationId?: string) => void;
  updateQuantity: (id: string, quantity: number, variationId?: string) => void;
  clearCart: () => void;
  completeOrder: (orderId: string, purchased: { product: string; variationId?: string; qty: number }[]) => void;
  totalItems: number; totalPrice: number; totalWeightKg: number;
  isCartOpen: boolean; setIsCartOpen: (open: boolean) => void;
}
const CartContext = createContext<CartContextType | undefined>(undefined);
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(() => { try { return readCart(localStorage.getItem(CART_STORAGE_KEY)); } catch { return readCart(null); } });
  const [isCartOpen, setIsCartOpen] = useState(false);
  useEffect(() => { try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state)); } catch { /* Browser storage may be disabled. */ } }, [state]);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === CART_STORAGE_KEY) setState(readCart(event.newValue)); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>, quantity = 1) => {
    if (!/^[a-f\d]{24}$/i.test(newItem.id) || !Number.isFinite(newItem.price) || newItem.price <= 0 || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return;
    setState(prev => {
      const key = cartKey(newItem), existing = prev.items.find(item => cartKey(item) === key);
      if (!existing && prev.items.length >= 50) return prev;
      return { ...prev, items: existing ? prev.items.map(item => cartKey(item) === key ? { ...item, quantity: Math.min(99, item.quantity + quantity) } : item) : [...prev.items, { ...newItem, quantity }] };
    });
    setIsCartOpen(true);
  }, []);
  const removeItem = useCallback((id: string, variationId?: string) => setState(prev => ({ ...prev, items: prev.items.filter(item => cartKey(item) !== cartKey({ id, variationId })) })), []);
  const updateQuantity = useCallback((id: string, quantity: number, variationId?: string) => {
    if (!Number.isInteger(quantity) || quantity > 99) return;
    if (quantity <= 0) { removeItem(id, variationId); return; }
    setState(prev => ({ ...prev, items: prev.items.map(item => cartKey(item) === cartKey({ id, variationId }) ? { ...item, quantity } : item) }));
  }, [removeItem]);
  const clearCart = useCallback(() => setState(prev => ({ ...prev, items: [] })), []);
  const completeOrder = useCallback((id: string, purchased: { product: string; variationId?: string; qty: number }[]) => setState(prev => finishOrder(prev, id, purchased)), []);
  const { items } = state;
  return <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, completeOrder,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100,
    totalWeightKg: Number(items.reduce((sum, item) => sum + (item.shippingWeightKg ?? item.weightKg ?? 1.2) * item.quantity, 0).toFixed(3)),
    isCartOpen, setIsCartOpen }}>{children}</CartContext.Provider>;
}
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
