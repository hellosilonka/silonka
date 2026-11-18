export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
  variationId?: string;
  weightKg?: number;
  shippingWeightKg?: number;
}
export const cartKey = (item: Pick<CartItem, 'id' | 'variationId'>) => `${item.id}:${item.variationId || ''}`;
export const CART_STORAGE_KEY = 'silonka_cart_usd_v3';
export interface CartState { items: CartItem[]; completedOrders: string[] }
const objectId = (value: unknown): value is string => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const optionalWeight = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 70 ? value : undefined;
function safeImage(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2000) return '';
  if (/^\/(?!\/)[^\s\\]+$/.test(value)) return value;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? value : ''; } catch { return ''; }
}
export function readCart(raw: string | null): CartState {
  try {
    const parsed = JSON.parse(raw || '{}');
    const items = new Map<string, CartItem>();
    for (const item of Array.isArray(parsed?.items) ? parsed.items.slice(0, 50) : []) {
      if (!item || !objectId(item.id) || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 120 || !Number.isFinite(item.price) || Math.round(item.price * 100) < 1 || item.price > 100000 || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99 || (item.variationId != null && item.variationId !== '' && !objectId(item.variationId))) continue;
      const clean: CartItem = { id: item.id.toLowerCase(), name: item.name, price: Math.round(item.price * 100) / 100, quantity: item.quantity, image: safeImage(item.image), variant: typeof item.variant === 'string' ? item.variant.slice(0, 80) : undefined, variationId: item.variationId ? item.variationId.toLowerCase() : undefined, weightKg: optionalWeight(item.weightKg), shippingWeightKg: optionalWeight(item.shippingWeightKg) };
      const key = cartKey(clean);
      clean.quantity = Math.min(99, clean.quantity + (items.get(key)?.quantity || 0));
      items.set(key, clean);
    }
    return {
      items: [...items.values()],
      completedOrders: Array.isArray(parsed?.completedOrders) ? [...new Set<string>(parsed.completedOrders.filter(objectId))].slice(-100) : [],
    };
  } catch { return { items: [], completedOrders: [] }; }
}
export function finishOrder(state: CartState, orderId: string, purchased: { product: string; variationId?: string; qty: number }[]): CartState {
  if (state.completedOrders.includes(orderId)) return state;
  return {
    completedOrders: [...state.completedOrders, orderId].slice(-100),
    items: state.items.map(item => ({ ...item, quantity: item.quantity - (purchased.find(p => p.product === item.id && (p.variationId || '') === (item.variationId || ''))?.qty || 0) })).filter(item => item.quantity > 0),
  };
}
