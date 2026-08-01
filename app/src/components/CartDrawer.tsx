import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

function getImageSrc(image: string): string {
  if (!image) return '';
  return image.startsWith('/uploads') ? `${BASE_URL}${image}` : image;
}

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { format } = useCurrency();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-charcoal-light border-l border-white/5 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-gold" />
            <h2 className="font-display text-xl text-ivory">Your Cart</h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-ivory-muted hover:text-ivory transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <ShoppingCart className="w-16 h-16 text-ivory-muted/30 mb-4" />
              <p className="font-display text-xl text-ivory-muted mb-2">Your cart is empty</p>
              <p className="text-ivory-muted/60 text-sm">Add some spices to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 rounded-card bg-charcoal border border-white/5"
                >
                  {/* Product image — fixed with BASE_URL prefix for /uploads */}
                  <img
                    src={getImageSrc(item.image)}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0 bg-charcoal-card"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23222'/%3E%3Ctext x='40' y='44' text-anchor='middle' fill='%23666' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-display text-lg text-ivory">{item.name}</h3>
                        {item.variant && (
                          <p className="font-mono text-label text-ivory-muted uppercase">
                            {item.variant}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-ivory-muted hover:text-gold transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-ivory hover:border-gold hover:text-gold transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-mono text-sm text-ivory w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-ivory hover:border-gold hover:text-gold transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="font-mono text-gold">
                        {format(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-ivory-muted">Subtotal</span>
              <span className="font-display text-2xl text-gold">{format(totalPrice)}</span>
            </div>
            <p className="text-ivory-muted/60 text-sm">Shipping calculated at checkout</p>
            <button
              onClick={() => {
                setIsCartOpen(false);
                navigate('/checkout');
              }}
              className="w-full bg-gold text-charcoal py-3 font-mono text-label uppercase rounded hover:bg-gold-light"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={clearCart}
              className="w-full py-3 text-ivory-muted hover:text-ivory font-mono text-label uppercase transition-colors"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
