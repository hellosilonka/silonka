import { httpError, textField } from './http.js';

export function shipmentOrderId(value) {
    if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) throw httpError(400, 'Choose a valid order.');
    return value;
}

export function pickupDate(value, now = new Date()) {
    const date = textField(value, 'pickup date', 10);
    const parsed = new Date(date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date < now.toISOString().slice(0, 10)) throw httpError(400, 'Choose a valid pickup date today or in the future.');
    return date;
}
