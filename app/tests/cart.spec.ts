import { test, expect } from '@playwright/test';
import { readCart, finishOrder } from '../src/lib/cart';

const id = '333333333333333333333333';
const item = { id, name: 'Cinnamon', image: '/photo.webp', price: 12.5, quantity: 2 };

test('stored cart strips malformed optional fields and unsafe images without crashing the shop', () => {
  const { items } = readCart(JSON.stringify({ items: [{ ...item, variant: {}, shippingWeightKg: 'heavy', weightKg: -1, image: 'javascript:alert(1)', unexpected: 'ignored' }] }));
  expect(items).toEqual([{ ...item, image: '', variant: undefined, shippingWeightKg: undefined, weightKg: undefined, variationId: undefined }]);
});

test('stored cart merges duplicate lines and rejects invalid quantities and identifiers', () => {
  const state = readCart(JSON.stringify({ items: [item, item, { ...item, quantity: 100 }, { ...item, variationId: {} }, { ...item, id: {} }], completedOrders: [{}, 'bad'] }));
  expect(state.items).toHaveLength(1); expect(state.items[0].quantity).toBe(4); expect(state.completedOrders).toEqual([]);
  expect(readCart('null').items).toEqual([]); expect(readCart('invalid').items).toEqual([]);
});

test('verified purchase removes only purchased quantities and applying it twice does not remove new items', () => {
  const order = '555555555555555555555555';
  const state = readCart(JSON.stringify({ items: [item] }));
  const completed = finishOrder(state, order, [{ product: id, qty: 1 }]);
  expect(completed.items[0].quantity).toBe(1);
  expect(finishOrder(completed, order, [{ product: id, qty: 1 }])).toBe(completed);
});
