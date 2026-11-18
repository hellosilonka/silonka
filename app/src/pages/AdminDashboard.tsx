import type { AdminProduct, AdminOrder, Category, BulkOrder, Blog } from '@/lib/types';
import type { UserInfo } from '@/context/AuthContext';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    getProducts, getOrders, deleteProduct,
    getCategories, createCategory, deleteCategory,
    getBulkOrders, updateBulkOrderStatus, deleteBulkOrdersBulk,
    markOrderDelivered, deleteOrdersBulk,
    getUsers, deleteUser, updateUser,
    getBlogs, createBlog, updateBlog, deleteBlog,
    getDashboardSummary, createDHLShipment, scheduleDHLPickup, getShippingLabel,
} from '@/lib/api';
import { Plus, Trash2, Pencil, X, Check, Upload, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';
import AdminShell, { type AdminTab as Tab } from '@/components/admin/AdminShell';
import AdminOverview, { type DashboardSummary } from '@/components/admin/AdminOverview';
import ProductCatalog from '@/components/admin/ProductCatalog';
const ProductEditor = lazy(() => import('@/components/admin/ProductEditor'));

const BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

const validTabs: Tab[] = ['stats', 'products', 'orders', 'categories', 'bulkorders', 'users', 'blog'];

function getImgSrc(url: string) {
    if (!url) return '';
    return url.startsWith('/uploads') ? `${BASE_URL}${url}` : url;
}

function Badge({ status }: { status: string }) {
    const map: Record<string, string> = {
        pending: 'bg-yellow-500/15 text-amber-700 border-yellow-500/30',
        confirmed: 'bg-green-500/15 text-green-700 border-green-500/30',
        rejected: 'bg-red-500/15 text-red-600 border-red-500/30',
    };
    return (
        <span className={`inline-flex px-2 py-0.5 rounded-full border font-sans text-[10px] uppercase tracking-wider ${map[status] || 'bg-stone-100 text-slate-500 border-white/20'}`}>
            {status}
        </span>
    );
}

// ─── Reusable Field Input ────────────────────────────────────────────────────
const inputCls = "admin-input";

export default function AdminDashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedTab = searchParams.get('tab') as Tab;
    const activeTab = validTabs.includes(requestedTab) ? requestedTab : 'stats';
    const setActiveTab = useCallback((tab: Tab) => setSearchParams({ tab }), [setSearchParams]);
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([]);
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [pagination, setPagination] = useState({ orders: { page: 1, pages: 1 }, bulkOrders: { page: 1, pages: 1 }, users: { page: 1, pages: 1 } });
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [selectedBulkOrders, setSelectedBulkOrders] = useState<Set<string>>(new Set());
    const [loadingTabs, setLoadingTabs] = useState<Partial<Record<Tab, boolean>>>({ stats: true });
    const [loadErrors, setLoadErrors] = useState<Partial<Record<Tab, string>>>({});
    const loadedTabs = useRef(new Set<Tab>());
    const requests = useRef(new Map<Tab, Promise<boolean>>());
    const pageVersions = useRef({ orders: 0, bulkOrders: 0, users: 0 });
    const loading = !!loadingTabs[activeTab];
    const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
    const [summary, setSummary] = useState<DashboardSummary>({ totalOrders: 0, pendingOrders: 0, revenue: 0, products: 0, inStock: 0, bulkOrders: 0, pendingBulk: 0 });
    const [shippingBusy, setShippingBusy] = useState<string | null>(null);
    const [shippingWeights, setShippingWeights] = useState<Record<string, string>>({});
    const [pickupDates, setPickupDates] = useState<Record<string, string>>({});
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // ── Product form state ────────────────────────────────────────────────────
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
    const editorTrigger = useRef<HTMLElement | null>(null);
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });
    const [showCategoryForm, setShowCategoryForm] = useState(false);

    // ── Blog form ─────────────────────────────────────────────────────────────
    const [showBlogForm, setShowBlogForm] = useState(false);
    const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
    const [blogForm, setBlogForm] = useState({ title: '', excerpt: '', content: '', tags: '', author: 'Silonka Team', readTime: '5', published: false });
    const [blogImageFile, setBlogImageFile] = useState<File | null>(null);
    const [blogImagePreview, setBlogImagePreview] = useState<string>('');
    const blogFileInputRef = useRef<HTMLInputElement>(null);

    const navigate = useNavigate();
    const { user, loading: authLoading, logoutUser } = useAuth();

    // ── Data fetching ─────────────────────────────────────────────────────────
    const fetchPage = useCallback(async (tab: 'orders' | 'bulkOrders' | 'users', page: number) => {
        const version = ++pageVersions.current[tab];
        const tabKey: Tab = tab === 'bulkOrders' ? 'bulkorders' : tab;
        setLoadingTabs(previous => ({ ...previous, [tabKey]: true }));
        try {
            const data = tab === 'orders' ? await getOrders({ page, limit: 10 }) : tab === 'bulkOrders' ? await getBulkOrders({ page, limit: 10 }) : await getUsers({ page, limit: 10 });
            if (version !== pageVersions.current[tab]) return false;
            if (tab === 'orders') { setOrders(Array.isArray(data) ? data : data.orders || []); setSelectedOrders(new Set()); }
            else if (tab === 'bulkOrders') { setBulkOrders(Array.isArray(data) ? data : data.orders || data.bulkOrders || []); setSelectedBulkOrders(new Set()); }
            else setUsers(Array.isArray(data) ? data : data.users || []);
            setPagination(previous => ({ ...previous, [tab]: { page, pages: Math.max(1, data.pages || 1) } }));
            setLoadErrors(previous => ({ ...previous, [tabKey]: '' }));
            return true;
        } catch (error) {
            if (version === pageVersions.current[tab]) setLoadErrors(previous => ({ ...previous, [tabKey]: errorMessage(error, 'Could not load this section. Please try again.') }));
            return false;
        } finally { if (version === pageVersions.current[tab]) setLoadingTabs(previous => ({ ...previous, [tabKey]: false })); }
    }, []);

    const loadTab = useCallback((tab: Tab, force = false): Promise<boolean> => {
        const inProgress = requests.current.get(tab);
        if (inProgress) return inProgress;
        if (!force && loadedTabs.current.has(tab)) return Promise.resolve(true);
        const request = (async () => {
            setLoadingTabs(previous => ({ ...previous, [tab]: true }));
            setLoadErrors(previous => ({ ...previous, [tab]: '' }));
            try {
                if (tab === 'stats') {
                    const [totals, latest] = await Promise.all([getDashboardSummary(), getOrders({ page: 1, limit: 5 })]);
                    setSummary(totals); setRecentOrders(Array.isArray(latest) ? latest : latest.orders || []);
                } else if (tab === 'products') {
                    const [prods, cats] = await Promise.all([getProducts(), getCategories()]);
                    setProducts(prods); setCategories(cats);
                } else if (tab === 'categories') setCategories(await getCategories());
                else if (tab === 'blog') setBlogs(await getBlogs(true));
                else if (!await fetchPage(tab === 'bulkorders' ? 'bulkOrders' : tab, 1)) return false;
                loadedTabs.current.add(tab);
                return true;
            } catch (error) {
                setLoadErrors(previous => ({ ...previous, [tab]: errorMessage(error, 'Could not load this section. Please try again.') }));
                return false;
            } finally { setLoadingTabs(previous => ({ ...previous, [tab]: false })); requests.current.delete(tab); }
        })();
        requests.current.set(tab, request);
        return request;
    }, [fetchPage]);

    const fetchAll = useCallback(() => {
        loadedTabs.current.delete('stats');
        return loadTab(activeTab, true);
    }, [activeTab, loadTab]);
    useEffect(() => {
        if (authLoading) return;
        if (!user?.isAdmin) navigate('/admin/login', { replace: true });
        else void loadTab(activeTab);
    }, [navigate, authLoading, user, activeTab, loadTab]);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });

    };

    // ── Selection helpers ─────────────────────────────────────────────────────
    const toggleSelection = (id: string, tab: 'orders' | 'bulkOrders') => {
        if (tab === 'orders') {
            setSelectedOrders(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
        } else {
            setSelectedBulkOrders(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
        }
    };

    const toggleAllSelection = (items: { _id: string }[], tab: 'orders' | 'bulkOrders', current: Set<string>) => {
        if (tab === 'orders') {
            setSelectedOrders(current.size === items.length ? new Set() : new Set(items.map(i => i._id)));
        } else {
            setSelectedBulkOrders(current.size === items.length ? new Set() : new Set(items.map(i => i._id)));
        }
    };

    const handleBulkDelete = async (tab: 'orders' | 'bulkOrders') => {
        if (tab === 'orders') {
            if (!window.confirm(`Delete ${selectedOrders.size} orders?`)) return;
            try { await deleteOrdersBulk(Array.from(selectedOrders)); loadedTabs.current.delete('stats'); setSelectedOrders(new Set()); showToast('Orders deleted'); fetchPage('orders', pagination.orders.page); }
            catch { showToast('Failed to delete orders', 'error'); }
        } else {
            if (!window.confirm(`Delete ${selectedBulkOrders.size} bulk orders?`)) return;
            try { await deleteBulkOrdersBulk(Array.from(selectedBulkOrders)); loadedTabs.current.delete('stats'); setSelectedBulkOrders(new Set()); showToast('Bulk orders deleted'); fetchPage('bulkOrders', pagination.bulkOrders.page); }
            catch { showToast('Failed to delete bulk orders', 'error'); }
        }
    };

    const handleLogout = async () => { try { await logoutUser(); navigate('/admin/login'); } catch { showToast('Sign out failed. Please try again.', 'error'); } };

    // ── Product handlers ──────────────────────────────────────────────────────
    const openNewProduct = async () => {
        editorTrigger.current = document.activeElement as HTMLElement | null;
        setActiveTab('products');
        if (await loadTab('products')) { setEditingProduct(null); setShowProductForm(true); }
    };
    const handleEditProduct = (product: AdminProduct) => { editorTrigger.current = document.activeElement as HTMLElement | null; setEditingProduct(product); setShowProductForm(true); };
    const closeProductEditor = () => {
        setShowProductForm(false); setEditingProduct(null);
        requestAnimationFrame(() => { (editorTrigger.current?.isConnected ? editorTrigger.current : document.querySelector<HTMLElement>('.catalog-toolbar > button'))?.focus(); });
    };
    const handleProductSaved = (product: AdminProduct) => {
        setProducts(previous => editingProduct ? previous.map(item => item._id === product._id ? product : item) : [product, ...previous]);
        loadedTabs.current.delete('stats');
        closeProductEditor();
        showToast(editingProduct ? 'Product updated successfully' : 'Product created successfully');
    };

    const handleDeleteProduct = async (id: string) => {
        if (!window.confirm('Delete this product?')) return;
        try { await deleteProduct(id); setProducts(previous => previous.filter(product => product._id !== id)); loadedTabs.current.delete('stats'); showToast('Product deleted'); }
        catch { showToast('Failed to delete', 'error'); }
    };

    // ── Blog handlers ─────────────────────────────────────────────────────────
    const resetBlogForm = () => {
        setBlogForm({ title: '', excerpt: '', content: '', tags: '', author: 'Silonka Team', readTime: '5', published: false });
        setBlogImageFile(null); setBlogImagePreview(''); setEditingBlog(null); setShowBlogForm(false);
    };

    const handleEditBlog = (blog: Blog) => {
        setEditingBlog(blog);
        setBlogForm({ title: blog.title, excerpt: blog.excerpt, content: blog.content, tags: (blog.tags || []).join(', '), author: blog.author || 'Silonka Team', readTime: String(blog.readTime || 5), published: blog.published });
        setBlogImagePreview(getImgSrc(blog.image || ''));
        setBlogImageFile(null); setShowBlogForm(true); setActiveTab('blog');
    };

    const handleBlogImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setBlogImageFile(file); setBlogImagePreview(URL.createObjectURL(file));
    };

    const handleBlogSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('title', blogForm.title); fd.append('excerpt', blogForm.excerpt);
        fd.append('content', blogForm.content);
        fd.append('tags', JSON.stringify(blogForm.tags.split(',').map(t => t.trim()).filter(Boolean)));
        fd.append('author', blogForm.author); fd.append('readTime', blogForm.readTime);
        fd.append('published', String(blogForm.published));
        if (blogImageFile) fd.append('image', blogImageFile);
        else if (editingBlog?.image) fd.append('image', editingBlog.image);
        try {
            if (editingBlog) { await updateBlog(editingBlog._id, fd); showToast('Blog post updated'); }
            else { await createBlog(fd); showToast('Blog post created'); }
            resetBlogForm(); fetchAll();
        } catch (err) { showToast(errorMessage(err, 'Error saving blog post'), 'error'); }
    };

    const handleDeleteBlog = async (id: string) => {
        if (!window.confirm('Delete this blog post?')) return;
        try { await deleteBlog(id); showToast('Blog post deleted'); fetchAll(); }
        catch { showToast('Failed to delete', 'error'); }
    };

    // ── Category handlers ─────────────────────────────────────────────────────
    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.name.trim()) return;
        try { await createCategory(newCategory); showToast('Category created'); setNewCategory({ name: '', description: '' }); setShowCategoryForm(false); fetchAll(); }
        catch (err) { showToast(errorMessage(err, 'Error creating category'), 'error'); }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!window.confirm('Delete this category?')) return;
        try { await deleteCategory(id); showToast('Category deleted'); fetchAll(); }
        catch { showToast('Failed to delete', 'error'); }
    };

    // ── Order handlers ────────────────────────────────────────────────────────

    const handleMarkDelivered = async (id: string) => {
        try { await markOrderDelivered(id); showToast('Order marked as delivered'); fetchAll(); }
        catch { showToast('Failed', 'error'); }
    };

    const handleBulkStatus = async (id: string, status: string) => {
        try { await updateBulkOrderStatus(id, status); showToast(`Status updated to ${status}`); fetchAll(); }
        catch { showToast('Failed', 'error'); }
    };

    const handleDeleteUser = async (id: string) => {
        if (!window.confirm('Delete user?')) return;
        try { await deleteUser(id); showToast('User deleted'); fetchPage('users', pagination.users.page); }
        catch (err) { showToast(errorMessage(err, 'Failed'), 'error'); }
    };

    const handleToggleAdmin = async (id: string, current: boolean) => {
        try { await updateUser(id, { isAdmin: !current }); showToast('User updated'); fetchPage('users', pagination.users.page); }
        catch (err) { showToast(errorMessage(err, 'Failed'), 'error'); }
    };

    // ── Pagination ────────────────────────────────────────────────────────────
    const PaginationControls = ({ tab, current, total }: { tab: 'orders' | 'bulkOrders' | 'users'; current: number; total: number }) => (
        total > 1 ? (
            <div className="catalog-pagination">
                <button disabled={loading || current <= 1} onClick={() => fetchPage(tab, current - 1)} className="admin-button secondary">Previous</button>
                <span>Page {current} of {total}</span>
                <button disabled={loading || current >= total} onClick={() => fetchPage(tab, current + 1)} className="admin-button secondary">Next</button>
            </div>
        ) : null
    );

    // ── Derived data ──────────────────────────────────────────────────────────


    const handleShipping = async (order: AdminOrder, action: 'ship' | 'pickup' | 'label') => {
        if (shippingBusy) return;
        if (action === 'ship' && !window.confirm('Create a DHL shipment for this paid order? Carrier charges may apply.')) return;
        setShippingBusy(order._id);
        try {
            if (action === 'ship') await createDHLShipment(order._id, order.shippingWeightKg || Number(shippingWeights[order._id]));
            if (action === 'pickup') await scheduleDHLPickup(order._id, pickupDates[order._id] || '');
            if (action === 'label') {
                const label = await getShippingLabel(order._id);
                const url = URL.createObjectURL(label), link = document.createElement('a');
                link.href = url; link.download = `DHL-${order._id.slice(-8)}.pdf`; link.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            } else {
                showToast(action === 'ship' ? 'DHL shipment created' : 'Pickup booked');
                await fetchPage('orders', pagination.orders.page);
            }
        } catch (error) { showToast(errorMessage(error, 'Shipping action failed. Please try again.'), 'error'); }
        finally { setShippingBusy(null); }
    };

    if (authLoading || !user?.isAdmin) return <div className="admin-workspace admin-loading" role="status"><Loader2 className="animate-spin" size={22} /> Loading your workspace...</div>;
    return <AdminShell activeTab={activeTab} onNavigate={setActiveTab} name={user.name || 'Administrator'} pendingBulk={summary.pendingBulk} loading={loading} onRefresh={() => void fetchAll()} onLogout={handleLogout}>
        {toast && <div role={toast.type === 'error' ? 'alert' : 'status'} className={`admin-toast ${toast.type}`}>
            {toast.type === 'success' ? <Check size={17} /> : <AlertCircle size={17} />}<span>{toast.msg}</span><button aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={16} /></button>
        </div>}
        {loading ? <div className="admin-loading" role="status"><Loader2 size={22} className="animate-spin" /> Loading {activeTab === 'stats' ? 'your overview' : 'this section'}...</div> : loadErrors[activeTab] ? <div className="admin-error-panel" role="alert"><AlertCircle size={22} /><div><strong>This section could not be loaded</strong><p>{loadErrors[activeTab]}</p></div><button className="admin-button secondary" onClick={() => void fetchAll()}>Try again</button></div> : <>
            {activeTab === 'stats' && <AdminOverview summary={summary} orders={recentOrders} onNavigate={setActiveTab} onAddProduct={openNewProduct} />}
            {activeTab === 'products' && <ProductCatalog products={products} categories={categories} onAdd={openNewProduct} onEdit={handleEditProduct} onDelete={handleDeleteProduct} />}
            <div className="admin-legacy">
{activeTab === 'orders' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-display text-xl font-light">Orders <span className="font-sans text-sm text-slate-500">({orders.length})</span></h2>
                                {selectedOrders.size > 0 && (
                                    <button onClick={() => handleBulkDelete('orders')} className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-2 rounded-xl text-xs font-sans uppercase tracking-widest flex items-center gap-2 transition-colors">
                                        <Trash2 className="w-4 h-4" /> Delete {selectedOrders.size} Selected
                                    </button>
                                )}
                            </div>
                            <div className="rounded-2xl border border-stone-200 bg-white overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-stone-200">
                                            <th className="w-10 px-4 py-3"><input type="checkbox" aria-label="Select all orders on this page" checked={selectedOrders.size === orders.length && orders.length > 0} onChange={() => toggleAllSelection(orders, 'orders', selectedOrders)} /></th>
                                            {['Order ID', 'Customer', 'Date', 'Total', 'Paid', 'Delivered', 'Actions'].map(h => (
                                                <th key={h} className="text-left px-4 py-3 font-sans text-[10px] uppercase tracking-widest text-slate-500">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(o => (
                                            <tr key={o._id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors">
                                                <td className="px-4 py-3"><input type="checkbox" aria-label={`Select order ${o._id}`} checked={selectedOrders.has(o._id)} onChange={() => toggleSelection(o._id, 'orders')} /></td>
                                                <td className="px-4 py-3 font-sans text-xs text-slate-500">{o._id.slice(-8).toUpperCase()}</td>
                                                <td className="px-4 py-3 text-slate-800">
                                                    {o.user?.name || o.shippingAddress?.fullName || 'Customer'}
                                                    <details className="text-xs text-slate-500 mt-1"><summary className="cursor-pointer text-emerald-800">Order details</summary>
                                                        <p className="mt-2">{o.shippingAddress?.address}, {o.shippingAddress?.city}, {o.shippingAddress?.postalCode}, {o.shippingAddress?.country}</p>
                                                        <p>{o.shippingAddress?.phone}</p>
                                                        {o.orderItems?.map((item, index) => <p key={index}>{item.name} {item.variant} × {item.qty}</p>)}
                                                    </details>
                                                </td>
                                                <td className="px-4 py-3 font-sans text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 font-sans text-emerald-800">{o.currency || 'Currency not recorded'} {o.totalPrice}</td>
                                                <td className="px-4 py-3">{o.isPaid ? <Badge status="confirmed" /> : <Badge status="pending" />}</td>
                                                <td className="px-4 py-3">{o.isDelivered ? <Badge status="confirmed" /> : <Badge status="pending" />}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-2 min-w-44">
                                                        <span className="text-xs text-slate-500">{o.paymentStatus || (o.isPaid ? 'paid' : 'pending')}</span>
                                                        {o.isPaid && !o.dhl?.shipmentCreated && !o.dhl?.shipmentCreating && <>
                                                            {!o.shippingWeightKg && <input aria-label={`Packed weight for order ${o._id}`} type="number" min="0.001" max="70" step="0.001" placeholder="Packed kg" value={shippingWeights[o._id] || ''} onChange={e => setShippingWeights(prev => ({ ...prev, [o._id]: e.target.value }))} className={`${inputCls} max-w-28`} />}
                                                            <button disabled={!!shippingBusy || (!o.shippingWeightKg && !Number(shippingWeights[o._id]))} onClick={() => handleShipping(o, 'ship')} className="text-emerald-800 text-xs underline disabled:opacity-50">Create DHL shipment</button>
                                                        </>}
                                                        {o.dhl?.shipmentCreating && <span className="text-xs text-amber-300">Check shipment with DHL before retrying</span>}
                                                        {o.dhl?.shipmentCreated && <>
                                                            <span className="text-xs text-slate-500">AWB {o.dhl.awbNumber}</span>
                                                            <button disabled={!!shippingBusy} onClick={() => handleShipping(o, 'label')} className="text-emerald-800 text-xs underline">Download label</button>
                                                            {o.isPaid && !o.dhl.pickupConfirmed && !o.dhl.pickupCreating && <>
                                                                <input aria-label={`Pickup date for order ${o._id}`} type="date" value={pickupDates[o._id] || ''} onChange={e => setPickupDates(prev => ({ ...prev, [o._id]: e.target.value }))} className={inputCls} />
                                                                <button disabled={!!shippingBusy || !pickupDates[o._id]} onClick={() => handleShipping(o, 'pickup')} className="text-emerald-800 text-xs underline disabled:opacity-50">Book pickup</button>
                                                            </>}
                                                            {o.dhl.pickupCreating && <span className="text-xs text-amber-300">Check pickup with DHL before retrying</span>}
                                                        </>}
                                                        {o.isPaid && !o.isDelivered && (
                                                            <button onClick={() => handleMarkDelivered(o._id)} className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 font-sans text-[10px] uppercase transition-colors">Mark Delivered</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {orders.length === 0 && <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-500 text-sm">No orders yet.</td></tr>}
                                    </tbody>
                                </table>
                                <PaginationControls tab="orders" current={pagination.orders.page} total={pagination.orders.pages} />
                            </div>
                        </div>
                    )}

                    {/* ── CATEGORIES ── */}
                    {activeTab === 'categories' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-display text-xl font-light">Categories <span className="font-sans text-sm text-slate-500">({categories.length})</span></h2>
                                <button onClick={() => setShowCategoryForm(!showCategoryForm)} className="flex items-center gap-2 bg-emerald-800 text-white px-4 py-2 rounded-xl font-sans text-xs uppercase tracking-widest hover:bg-emerald-900 transition-colors">
                                    {showCategoryForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {showCategoryForm ? 'Cancel' : 'Add Category'}
                                </button>
                            </div>
                            {showCategoryForm && (
                                <div className="mb-6 rounded-2xl border border-emerald-200 bg-white p-6">
                                    <h3 className="font-display text-lg mb-4 text-emerald-800">New Category</h3>
                                    <form onSubmit={handleCreateCategory} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block font-sans text-[11px] uppercase tracking-widest text-slate-500 mb-2">Name *</label>
                                            <input required value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} className={inputCls} />
                                        </div>
                                        <div>
                                            <label className="block font-sans text-[11px] uppercase tracking-widest text-slate-500 mb-2">Description</label>
                                            <input value={newCategory.description} onChange={e => setNewCategory({ ...newCategory, description: e.target.value })} className={inputCls} />
                                        </div>
                                        <div className="flex items-end">
                                            <button type="submit" className="w-full py-2.5 bg-emerald-800 text-white rounded-xl font-sans text-xs uppercase tracking-widest hover:bg-emerald-900 transition-colors">Create</button>
                                        </div>
                                    </form>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categories.map(cat => (
                                    <div key={cat._id} className="rounded-2xl border border-stone-200 bg-white p-5 flex items-start justify-between group">
                                        <div>
                                            <p className="text-slate-800 font-medium">{cat.name}</p>
                                            {cat.description && <p className="text-slate-500 text-xs mt-1">{cat.description}</p>}
                                            <p className="font-sans text-[10px] text-slate-500/50 mt-2">/{cat.slug}</p>
                                        </div>
                                        <button aria-label={`Delete category ${cat.name}`} onClick={() => handleDeleteCategory(cat._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-600 transition-all">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {categories.length === 0 && <div className="col-span-3 py-12 text-center text-slate-500 text-sm">No categories yet.</div>}
                            </div>
                        </div>
                    )}

                    {/* ── BULK ORDERS ── */}
                    {activeTab === 'bulkorders' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-display text-xl font-light">Bulk Orders <span className="font-sans text-sm text-slate-500">({bulkOrders.length})</span></h2>
                                {selectedBulkOrders.size > 0 && (
                                    <button onClick={() => handleBulkDelete('bulkOrders')} className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-2 rounded-xl text-xs font-sans uppercase tracking-widest flex items-center gap-2 transition-colors">
                                        <Trash2 className="w-4 h-4" /> Delete {selectedBulkOrders.size} Selected
                                    </button>
                                )}
                            </div>
                            <div className="space-y-4">
                                {bulkOrders.map(b => (
                                    <div key={b._id} className="rounded-2xl border border-stone-200 bg-white p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <input type="checkbox" aria-label={`Select enquiry from ${b.companyName}`} checked={selectedBulkOrders.has(b._id)} onChange={() => toggleSelection(b._id, 'bulkOrders')} />
                                                    <h3 className="text-slate-800 font-medium">{b.companyName}</h3>
                                                    <Badge status={b.status} />
                                                </div>
                                                <p className="font-sans text-xs text-slate-500">{b.contactName} · {b.email} · {b.phone}</p>
                                                <p className="font-sans text-xs text-slate-500 mt-1">{new Date(b.createdAt).toLocaleDateString()} · Ref #{b._id.slice(-8).toUpperCase()}</p>
                                            </div>
                                            {b.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleBulkStatus(b._id, 'confirmed')} className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-700 hover:bg-green-500/20 font-sans text-[10px] uppercase transition-colors flex items-center gap-1"><Check className="w-3 h-3" /> Confirm</button>
                                                    <button onClick={() => handleBulkStatus(b._id, 'rejected')} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 font-sans text-[10px] uppercase transition-colors flex items-center gap-1"><X className="w-3 h-3" /> Reject</button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                            {b.products?.map((prod, i: number) => (
                                                <div key={i} className="bg-white/4 rounded-lg px-3 py-2">
                                                    <p className="text-slate-800 text-xs">{prod.productName}</p>
                                                    <p className="font-sans text-[10px] text-emerald-800 mt-0.5">{prod.quantity} units</p>
                                                </div>
                                            ))}
                                        </div>
                                        {b.notes && <p className="text-slate-500 text-xs border-t border-stone-100 pt-3 mt-2">Notes: {b.notes}</p>}
                                    </div>
                                ))}
                                <PaginationControls tab="bulkOrders" current={pagination.bulkOrders.page} total={pagination.bulkOrders.pages} />
                                {bulkOrders.length === 0 && <div className="py-16 text-center text-slate-500 text-sm">No bulk inquiries yet.</div>}
                            </div>
                        </div>
                    )}

                    {/* ── USERS ── */}
                    {activeTab === 'users' && (
                        <div>
                            <h2 className="font-display text-xl font-light mb-6">Users <span className="font-sans text-sm text-slate-500">({users.length})</span></h2>
                            <div className="rounded-2xl border border-stone-200 bg-white overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-stone-200">
                                            {['Name', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                                                <th key={h} className="text-left px-4 py-3 font-sans text-[10px] uppercase tracking-widest text-slate-500">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u._id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors">
                                                <td className="px-4 py-3 text-slate-800">{u.name}</td>
                                                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full font-sans text-[10px] uppercase tracking-wider ${u.isAdmin ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-stone-50 text-slate-500 border-stone-200'} border`}>
                                                        {u.isAdmin ? 'Admin' : 'User'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-sans text-xs text-slate-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleToggleAdmin(u._id, u.isAdmin)} className="px-2 py-1 rounded bg-stone-50 hover:bg-stone-100 text-xs font-sans uppercase transition-colors">Toggle Admin</button>
                                                        <button aria-label={`Delete user ${u.name}`} onClick={() => handleDeleteUser(u._id)} className="px-2 py-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <PaginationControls tab="users" current={pagination.users.page} total={pagination.users.pages} />
                            </div>
                        </div>
                    )}

                    {/* ── BLOG ── */}
                    {activeTab === 'blog' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-display text-xl font-light">Blog Posts <span className="font-sans text-sm text-slate-500">({blogs.length})</span></h2>
                                <button onClick={() => { resetBlogForm(); setShowBlogForm(!showBlogForm); }} className="flex items-center gap-2 bg-emerald-800 text-white px-4 py-2 rounded-xl font-sans text-xs uppercase tracking-widest hover:bg-emerald-900 transition-colors">
                                    {showBlogForm && !editingBlog ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {showBlogForm && !editingBlog ? 'Cancel' : 'New Post'}
                                </button>
                            </div>

                            {showBlogForm && (
                                <div className="mb-6 rounded-2xl border border-emerald-200 bg-white p-6">
                                    <h3 className="font-display text-lg mb-5 text-emerald-800">{editingBlog ? 'Edit Blog Post' : 'New Blog Post'}</h3>
                                    <form onSubmit={handleBlogSubmit} className="space-y-5">
                                        <div>
                                            <label className="block font-sans text-[11px] uppercase tracking-widest text-slate-500 mb-2">Cover Image</label>
                                            <div onClick={() => blogFileInputRef.current?.click()} className="relative border-2 border-dashed border-stone-200 rounded-xl p-6 cursor-pointer hover:border-emerald-400 transition-colors flex flex-col items-center justify-center gap-3 min-h-[120px] group">
                                                {blogImagePreview ? (
                                                    <div className="flex items-center gap-4">
                                                        <img src={blogImagePreview} alt="Preview" className="w-32 h-20 object-cover rounded-lg border border-stone-200" />
                                                        <p className="text-slate-500 text-xs">Click to change image</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors"><Upload className="w-5 h-5 text-slate-500 group-hover:text-emerald-800" /></div>
                                                        <p className="text-slate-800 text-sm">Click to upload cover image</p>
                                                        <p className="text-slate-500 text-xs">PNG, JPG, WebP or AVIF up to 5 MB</p>
                                                    </>
                                                )}
                                                <input ref={blogFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBlogImageChange} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block font-sans text-[11px] uppercase tracking-widest text-slate-500 mb-2">Title *</label>
                                                <input required value={blogForm.title} onChange={e => setBlogForm({ ...blogForm, title: e.target.value })} className={inputCls} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block font-sans text-[11px] uppercase tracking-widest text-slate-500 mb-2">Excerpt / Summary *</label>
                                                <textarea required rows={2} value={blogForm.excerpt} onChange={e => setBlogForm({ ...blogForm, excerpt: e.target.value })} className={`${inputCls} resize-none`} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block font-sans text-[11px] uppercase tracking-widest text-slate-500 mb-2">Content *</label>
                                                <p className="text-slate-500 text-xs mb-2">Use ## for headings, - for lists, &gt; for quotes.</p>
                                                <textarea required rows={14} value={blogForm.content} onChange={e => setBlogForm({ ...blogForm, content: e.target.value })} className={`${inputCls} resize-y font-sans`} placeholder="## Introduction&#10;&#10;Your article content here..." />
                                            </div>
                                            <div>
                                                <label className="block font-sans text-[11px] uppercase tracking-widest text-slate-500 mb-2">Tags (comma separated)</label>
                                                <input value={blogForm.tags} onChange={e => setBlogForm({ ...blogForm, tags: e.target.value })} placeholder="cinnamon, recipes, health" className={inputCls} />
                                            </div>
                                            <div>
                                                <label className="block font-sans text-[11px] uppercase tracking-widest text-slate-500 mb-2">Author</label>
                                                <input value={blogForm.author} onChange={e => setBlogForm({ ...blogForm, author: e.target.value })} className={inputCls} />
                                            </div>
                                            <div>
                                                <label className="block font-sans text-[11px] uppercase tracking-widest text-slate-500 mb-2">Read Time (minutes)</label>
                                                <input type="number" min={1} value={blogForm.readTime} onChange={e => setBlogForm({ ...blogForm, readTime: e.target.value })} className={inputCls} />
                                            </div>
                                            <div className="flex items-center gap-3 pt-2">
                                                <label className="font-sans text-[11px] uppercase tracking-widest text-slate-500">Publish Now</label>
                                                <button type="button" onClick={() => setBlogForm({ ...blogForm, published: !blogForm.published })} className={`relative w-11 h-6 rounded-full transition-colors ${blogForm.published ? 'bg-green-500' : 'bg-white/20'}`}>
                                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${blogForm.published ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </button>
                                                <span className="font-sans text-xs text-slate-500">{blogForm.published ? 'Published' : 'Draft'}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button type="submit" className="flex-1 py-3 bg-emerald-800 text-white rounded-xl font-sans text-xs uppercase tracking-widest hover:bg-emerald-900 transition-colors">{editingBlog ? 'Update Post' : 'Create Post'}</button>
                                            <button type="button" onClick={resetBlogForm} className="px-6 py-3 rounded-xl border border-stone-200 font-sans text-xs uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="rounded-2xl border border-stone-200 bg-white overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-stone-200">
                                            {['Cover', 'Title', 'Tags', 'Status', 'Date', 'Actions'].map(h => (
                                                <th key={h} className="text-left px-4 py-3 font-sans text-[10px] uppercase tracking-widest text-slate-500">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {blogs.map(b => (
                                            <tr key={b._id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="w-14 h-10 rounded-lg overflow-hidden bg-stone-50">
                                                        {b.image ? <img src={getImgSrc(b.image)} alt={b.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-slate-500" /></div>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-slate-800 text-sm font-medium line-clamp-1">{b.title}</p>
                                                    <p className="text-slate-500 text-xs font-sans mt-0.5 line-clamp-1">{b.excerpt}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {(b.tags || []).slice(0, 2).map((t: string) => (
                                                            <span key={t} className="bg-emerald-50 text-emerald-800 font-sans text-[9px] uppercase px-2 py-0.5 rounded-full">{t}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full border font-sans text-[10px] uppercase tracking-wider ${b.published ? 'bg-green-500/15 text-green-700 border-green-500/30' : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'}`}>
                                                        {b.published ? 'Published' : 'Draft'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-sans text-xs text-slate-500">{new Date(b.createdAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <button aria-label={`Edit article ${b.title}`} onClick={() => handleEditBlog(b)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-emerald-800 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                                        <button aria-label={`Delete article ${b.title}`} onClick={() => handleDeleteBlog(b._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {blogs.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500 text-sm">No blog posts yet.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

            </div>
        </>}
        {showProductForm && <Suspense fallback={<div role="status" className="admin-toast"><Loader2 size={17} className="animate-spin" /> Opening product editor...</div>}><ProductEditor key={editingProduct?._id || 'new'} product={editingProduct} categories={categories} onCategoryCreated={category => { setCategories(previous => [...previous, category]); loadedTabs.current.delete('categories'); }} onSaved={handleProductSaved} onClose={closeProductEditor} /></Suspense>}
    </AdminShell>;
}
