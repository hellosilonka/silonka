import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
});

// ─── Auth ───────────────────────────────
export const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
};

export const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data;
};

export const googleLogin = async (token: string) => {
    const { data } = await api.post('/auth/google', { token });
    return data;
};

export const logout = async () => {
    const { data } = await api.post('/auth/logout');
    return data;
};

export const getUsers = async (params?: { page?: number; limit?: number }) => {
    const { data } = await api.get('/auth/users', { params });
    return data;
};

export const deleteUser = async (id: string) => {
    const { data } = await api.delete(`/auth/users/${id}`);
    return data;
};

export const updateUser = async (id: string, userData: { isAdmin: boolean }) => {
    const { data } = await api.put(`/auth/users/${id}`, userData);
    return data;
};

// ─── Products ───────────────────────────
export const getProducts = async (params?: { category?: string; search?: string }) => {
    const { data } = await api.get('/products', { params });
    return data;
};

export const getProductById = async (id: string) => {
    const { data } = await api.get(`/products/${id}`);
    return data;
};

export const createProduct = async (formData: FormData) => {
    const { data } = await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export const updateProduct = async (id: string, formData: FormData | Record<string, any>) => {
    const isFormData = formData instanceof FormData;
    const { data } = await api.put(`/products/${id}`, formData, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return data;
};

export const deleteProduct = async (id: string) => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
};

export const addProductReview = async (id: string, review: { rating: number; comment: string }) => {
    const { data } = await api.post(`/products/${id}/reviews`, review);
    return data;
};

export const getRelatedProducts = async (id: string) => {
    const { data } = await api.get(`/products/${id}/related`);
    return data;
};

// ─── Orders ─────────────────────────────
export const getOrders = async (params?: { page?: number; limit?: number }) => {
    const { data } = await api.get('/orders', { params });
    return data;
};

export const getMyOrders = async () => {
    const { data } = await api.get('/orders/myorders');
    return data;
};

export const createOrder = async (orderData: any) => {
    const { data } = await api.post('/orders', orderData);
    return data;
};

export const markOrderPaid = async (id: string, paymentResult: any) => {
    const { data } = await api.put(`/orders/${id}/pay`, paymentResult);
    return data;
};

export const markOrderDelivered = async (id: string) => {
    const { data } = await api.put(`/orders/${id}/deliver`);
    return data;
};

export const deleteOrder = async (id: string) => {
    const { data } = await api.delete(`/orders/${id}`);
    return data;
};

export const deleteOrdersBulk = async (ids: string[]) => {
    const { data } = await api.delete('/orders', { data: { ids } });
    return data;
};

// ─── Categories ─────────────────────────
export const getCategories = async () => {
    const { data } = await api.get('/categories');
    return data;
};

export const createCategory = async (categoryData: { name: string; description?: string }) => {
    const { data } = await api.post('/categories', categoryData);
    return data;
};

export const deleteCategory = async (id: string) => {
    const { data } = await api.delete(`/categories/${id}`);
    return data;
};

// ─── Bulk Orders ─────────────────────────
export const createBulkOrder = async (bulkOrderData: any) => {
    const { data } = await api.post('/bulk-orders', bulkOrderData);
    return data;
};

export const getBulkOrders = async (params?: { page?: number; limit?: number }) => {
    const { data } = await api.get('/bulk-orders', { params });
    return data;
};

export const updateBulkOrderStatus = async (id: string, status: string) => {
    const { data } = await api.put(`/bulk-orders/${id}`, { status });
    return data;
};

export const deleteBulkOrder = async (id: string) => {
    const { data } = await api.delete(`/bulk-orders/${id}`);
    return data;
};

export const deleteBulkOrdersBulk = async (ids: string[]) => {
    const { data } = await api.delete('/bulk-orders', { data: { ids } });
    return data;
};

// ─── Payment (PayPal) ────────────────────
export const createPayPalOrder = async (orderId: string) => {
    const { data } = await api.post('/payment/create-order', { orderId });
    return data;
};

export const capturePayPalOrder = async (paypalOrderId: string, orderId: string) => {
    const { data } = await api.post('/payment/capture-order', { paypalOrderId, orderId });
    return data;
};

export const getPayPalConfig = async () => {
    const { data } = await api.get('/payment/config');
    return data;
};

// ─── Blog ─────────────────────────────────
export const getBlogs = async (adminMode = false) => {
    const { data } = await api.get('/blogs', { params: adminMode ? { admin: 'true' } : {} });
    return data;
};

export const getBlogBySlug = async (slug: string) => {
    const { data } = await api.get(`/blogs/slug/${slug}`);
    return data;
};

export const getBlogById = async (id: string) => {
    const { data } = await api.get(`/blogs/id/${id}`);
    return data;
};

export const createBlog = async (formData: FormData) => {
    const { data } = await api.post('/blogs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export const updateBlog = async (id: string, formData: FormData) => {
    const { data } = await api.put(`/blogs/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export const deleteBlog = async (id: string) => {
    const { data } = await api.delete(`/blogs/${id}`);
    return data;
};

export default api;
