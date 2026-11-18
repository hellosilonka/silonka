import { httpError, textField } from './http.js';

const numeric = (value, label, min, max) => {
    if (!['string', 'number'].includes(typeof value) || String(value).trim() === '' || !Number.isFinite(Number(value)) || Number(value) < min || Number(value) > max) throw httpError(400, `${label} must be between ${min} and ${max}.`);
    return Number(value);
};
const price = (value, label) => {
    const result = numeric(value, label, 0.01, 100000);
    if (Math.abs(result * 100 - Math.round(result * 100)) > 0.000001) throw httpError(400, `${label} must have no more than two decimal places.`);
    return result;
};
const boolean = (value, label) => {
    if (![true, false, 'true', 'false'].includes(value)) throw httpError(400, `${label} must be true or false.`);
    return value === true || value === 'true';
};
export function productArray(value, label, max) {
    let list = value;
    if (typeof value === 'string') { try { list = JSON.parse(value); } catch { throw httpError(400, `${label} must be a valid list.`); } }
    if (!Array.isArray(list) || list.length > max) throw httpError(400, `${label} must contain no more than ${max} entries.`);
    return list;
}
export function productImage(value) {
    const image = textField(value, 'cover image', 2000);
    if (/^\/(?!\/)[^\s\\]+$/.test(image)) return image;
    let url;
    try { url = new URL(image); } catch { throw httpError(400, 'Add a valid cover image.'); }
    if (url.protocol !== 'https:' || url.username || url.password) throw httpError(400, 'Cover images must use HTTPS.');
    return image;
}

export function productInput(body, { partial = false, existingOptionIds = [] } = {}) {
    const data = {};
    for (const [key, label, max, required] of [
        ['name', 'product name', 120, true], ['description', 'short description', 1000, true],
        ['category', 'category', 100, true], ['weight', 'pack size', 80, true],
        ['longDescription', 'full description', 12000, false], ['origin', 'origin', 100, false],
        ['ingredients', 'ingredients', 1000, false], ['shelfLife', 'shelf life', 100, false],
    ]) {
        if (body[key] !== undefined || (!partial && required)) data[key] = textField(body[key], label, max, required);
    }
    if (body.price !== undefined || !partial) data.price = price(body.price, 'Base price');
    if (body.shippingWeightKg !== undefined || !partial) data.shippingWeightKg = numeric(body.shippingWeightKg, 'Packed shipping weight', 0.001, 70);
    if (body.inStock !== undefined) data.inStock = boolean(body.inStock, 'Availability');
    for (const key of ['priceIsSample', 'imageIsReference', 'shippingWeightEstimated']) {
        if (body[key] !== undefined) data[key] = boolean(body[key], key);
    }
    if (body.intensity !== undefined) {
        data.intensity = body.intensity === '' || body.intensity === null ? undefined : numeric(body.intensity, 'Intensity', 1, 5);
        if (data.intensity !== undefined && !Number.isInteger(data.intensity)) throw httpError(400, 'Intensity must be a whole number from 1 to 5.');
    }
    if (body.certifications !== undefined) {
        let list = body.certifications;
        if (typeof list === 'string' && !list.trim().startsWith('[')) list = list.split(',').map(value => value.trim()).filter(Boolean);
        data.certifications = productArray(list, 'Certifications', 20).map(value => textField(value, 'certification', 100));
    }
    if (body.variations !== undefined) {
        const names = new Set(), ids = new Set();
        data.variations = productArray(body.variations, 'Product options', 20).map((option, index) => {
            if (!option || typeof option !== 'object' || Array.isArray(option)) throw httpError(400, `Option ${index + 1} is invalid.`);
            const label = textField(option.label, `option ${index + 1} name`, 80);
            if (names.has(label.toLowerCase())) throw httpError(400, 'Each product option must have a different name.');
            names.add(label.toLowerCase());
            const item = { label, price: price(option.price, `Option ${index + 1} price`), inStock: option.inStock === undefined ? true : boolean(option.inStock, 'Option availability') };
            if (option._id !== undefined) {
                if (typeof option._id !== 'string' || !existingOptionIds.includes(option._id) || ids.has(option._id)) throw httpError(400, 'An existing product option is invalid. Reload the product before editing.');
                item._id = option._id; ids.add(option._id);
            }
            if (option.shippingWeightKg !== undefined && option.shippingWeightKg !== '') item.shippingWeightKg = numeric(option.shippingWeightKg, `Option ${index + 1} packed weight`, 0.001, 70);
            if (option.image !== undefined) item.image = option.image === '' ? '' : productImage(option.image);
            return item;
        });
    }
    return data;
}
