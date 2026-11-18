import { Plus, Minus, ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { cartKey } from '@/lib/cart';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { format } = useCurrency();
  const navigate = useNavigate();
  return <Dialog.Root open={isCartOpen} onOpenChange={setIsCartOpen}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
    <Dialog.Content aria-describedby="cart-description" className="fixed right-0 top-0 h-dvh w-full max-w-md bg-charcoal-light border-l border-white/10 z-50 flex flex-col shadow-2xl" data-lenis-prevent>
      <div className="flex items-center justify-between p-5 border-b border-white/10"><Dialog.Title className="font-display text-2xl text-ivory flex items-center gap-3"><ShoppingCart className="text-gold" size={22} /> Your cart</Dialog.Title><Dialog.Close aria-label="Close cart" className="p-2 text-ivory-muted hover:text-ivory"><X /></Dialog.Close></div>
      <Dialog.Description id="cart-description" className="sr-only">Review your items and quantities before checkout.</Dialog.Description>
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {!items.length ? <div className="py-16 text-center"><ShoppingCart className="mx-auto text-ivory-muted/40 mb-4" size={48} /><p className="text-ivory mb-2">Your cart is empty</p><p className="text-ivory-muted text-sm">Explore the shop to find your favourite spices.</p><button className="text-gold underline mt-5" onClick={() => { setIsCartOpen(false); navigate('/shop'); }}>Browse spices</button></div> :
        <ul className="space-y-4">{items.map(item => <li key={cartKey(item)} className="flex gap-3 p-3 rounded-xl bg-charcoal border border-white/5">
          <img src={item.image} alt="" width={64} height={64} className="w-16 h-16 object-cover rounded-lg shrink-0 bg-charcoal-card" />
          <div className="min-w-0 flex-1"><div className="flex justify-between items-start gap-2"><div><p className="text-ivory break-words">{item.name}</p><p className="text-sm text-ivory-muted">{item.variant}</p></div><button aria-label={`Remove ${item.name} ${item.variant || ''}`} onClick={() => removeItem(item.id, item.variationId)} className="p-1 text-ivory-muted hover:text-gold"><X size={18} /></button></div>
          <div className="flex flex-wrap justify-between items-center gap-2 mt-3"><div className="flex items-center gap-2"><button aria-label={`Decrease quantity of ${item.name}`} className="w-9 h-9 border border-white/20 rounded-full flex items-center justify-center text-ivory" onClick={() => updateQuantity(item.id, item.quantity - 1, item.variationId)}><Minus size={16} /></button><span className="text-sm text-ivory min-w-5 text-center" aria-live="polite">{item.quantity}</span><button aria-label={`Increase quantity of ${item.name}`} disabled={item.quantity >= 99} className="w-9 h-9 border border-white/20 rounded-full flex items-center justify-center text-ivory disabled:opacity-40" onClick={() => updateQuantity(item.id, item.quantity + 1, item.variationId)}><Plus size={16} /></button></div><span className="text-gold text-sm">{format(item.price * item.quantity)}</span></div></div>
        </li>)}</ul>}
      </div>
      {!!items.length && <div className="p-5 border-t border-white/10 space-y-4"><div className="flex justify-between text-ivory"><span>Subtotal</span><span className="text-gold text-2xl font-display">{format(totalPrice)}</span></div><p className="text-ivory-muted text-sm">Shipping calculated at checkout. Payments are charged in USD.</p><button className="btn-gold w-full" onClick={() => { setIsCartOpen(false); navigate('/checkout'); }}>Proceed to checkout</button><button className="w-full text-ivory-muted text-sm py-2" onClick={clearCart}>Clear cart</button></div>}
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
