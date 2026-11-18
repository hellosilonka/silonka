export const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
export const httpError = (status, message) => Object.assign(new Error(message), { status });

export function textField(value, label, max = 200, required = true) {
    if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw httpError(400, `Please enter a valid ${label}.`);
    return value.trim();
}
export function emailField(value) {
    const email = textField(value, 'email address', 254).toLowerCase();
    if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email)) throw httpError(400, 'Please enter a valid email address.');
    return email;
}
export function pagination(query) {
    const page = Number(query.page ?? 1), limit = Number(query.limit ?? 10);
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw httpError(400, 'Page must be 1–10000 and limit must be 1–100.');
    return { page, limit, skip: (page - 1) * limit };
}
export const escapeMarkup = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
