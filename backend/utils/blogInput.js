import { textField, httpError } from './http.js';
import { productArray, productImage } from './productInput.js';

export function blogInput(body, { partial = false } = {}) {
    const data = {};
    for (const [key, max, required] of [['title', 180, true], ['excerpt', 1000, true], ['content', 100000, true], ['author', 100, false]]) {
        if (body[key] !== undefined || (!partial && required)) data[key] = textField(body[key], key, max, required);
    }
    if (body.tags !== undefined) data.tags = [...new Set(productArray(body.tags, 'Tags', 20).map(tag => textField(tag, 'tag', 50)))];
    if (body.published !== undefined) {
        if (![true, false, 'true', 'false'].includes(body.published)) throw httpError(400, 'Published must be true or false.');
        data.published = body.published === true || body.published === 'true';
    }
    if (body.readTime !== undefined) {
        if (!['string', 'number'].includes(typeof body.readTime) || !Number.isInteger(Number(body.readTime)) || Number(body.readTime) < 1 || Number(body.readTime) > 120) throw httpError(400, 'Reading time must be a whole number from 1 to 120 minutes.');
        data.readTime = Number(body.readTime);
    }
    if (body.image !== undefined) data.image = body.image === '' ? '' : productImage(body.image);
    if (body.slug !== undefined) {
        data.slug = textField(body.slug, 'article URL', 220).toLowerCase();
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) throw httpError(400, 'Article URLs must use letters, numbers and single hyphens.');
    }
    return data;
}
