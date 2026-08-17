import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getProducts, getOrders, createProduct, updateProduct, deleteProduct,
    getCategories, createCategory, deleteCategory,
    getBulkOrders, updateBulkOrderStatus, deleteBulkOrdersBulk,
    markOrderPaid, markOrderDelivered, deleteOrdersBulk,
    getUsers, deleteUser, updateUser,
    getBlogs, createBlog, updateBlog, deleteBlog,
} from '@/lib/api';
import {
    LayoutDashboard, Package, ShoppingBag, Tag, ClipboardList,
    LogOut, Plus, Trash2, Pencil, X, Check, ChevronRight,
    TrendingUp, Upload, Image as ImageIcon, AlertCircle, Menu, Users, BookOpen,
    Star, Search, Images
} from 'lucide-react';

const BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

type Tab = 'stats' | 'products' | 'orders' | 'categories' | 'bulkorders' | 'users' | 'blog';

function getImgSrc(url: string) {
    if (!url) return '';
    return url.startsWith('/uploads') ? `${BASE_URL}${url}` : url;
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-[#1e1d18] to-[#161510] p-6">
            <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 ${color || 'bg-gold'}`} />
            <p className="font-mono text-[11px] uppercase tracking-widest text-ivory-muted mb-3">{label}</p>
            <p className={`font-display text-4xl font-light ${color ? 'text-gold' : 'text-ivory'}`}>{value}</p>
            {sub && <p className="font-mono text-xs text-ivory-muted mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-400" />{sub}</p>}
        </div>
    );
}

function Badge({ status }: { status: string }) {
    const map: Record<string, string> = {
        pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
        confirmed: 'bg-green-500/15 text-green-400 border-green-500/30',
        rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
    };
    return (
        <span className={`inline-flex px-2 py-0.5 rounded-full border font-mono text-[10px] uppercase tracking-wider ${map[status] || 'bg-white/10 text-ivory-muted border-white/20'}`}>
            {status}
        </span>
    );
}

// ─── Reusable Field Input ────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block font-mono text-[11px] uppercase tracking-widest text-ivory-muted mb-1.5">{label}</label>
            {children}
        </div>
    );
}

const inputCls = "w-full bg-[#0f0f0c] border border-white/10 text-ivory px-3 py-2.5 rounded-xl outline-none focus:border-gold/60 transition-colors text-sm";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>('stats');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [products, setProducts] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [bulkOrders, setBulkOrders] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [blogs, setBlogs] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ orders: { page: 1, pages: 1 }, bulkOrders: { page: 1, pages: 1 }, users: { page: 1, pages: 1 } });
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [selectedBulkOrders, setSelectedBulkOrders] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // ── Product form state ────────────────────────────────────────────────────
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [productForm, setProductForm] = useState({
        name: '', price: '', description: '', longDescription: '',
        category: '', weight: '', intensity: '', inStock: true,
        origin: 'Sri Lanka', ingredients: '', shelfLife: '', certifications: '',
    });
    // Multi-image
    const [primaryFile, setPrimaryFile] = useState<File | null>(null);
    const [primaryPreview, setPrimaryPreview] = useState<string>('');
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [existingGallery, setExistingGallery] = useState<string[]>([]);
    const [removedGalleryUrls, setRemovedGalleryUrls] = useState<string[]>([]);
    // Variations
    const [variations, setVariations] = useState<{ label: string; price: string; inStock: boolean }[]>([]);
    // Filters
    const [productSearch, setProductSearch] = useState('');
    const [productFilterCat, setProductFilterCat] = useState('');
    const primaryFileRef = useRef<HTMLInputElement>(null);
    const galleryFileRef = useRef<HTMLInputElement>(null);

    // ── Category form ─────────────────────────────────────────────────────────
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });
    const [showCategoryForm, setShowCategoryForm] = useState(false);

    // ── Blog form ─────────────────────────────────────────────────────────────
    const [showBlogForm, setShowBlogForm] = useState(false);
    const [editingBlog, setEditingBlog] = useState<any | null>(null);
    const [blogForm, setBlogForm] = useState({ title: '', excerpt: '', content: '', tags: '', author: 'Silonka Team', readTime: '5', published: false });
    const [blogImageFile, setBlogImageFile] = useState<File | null>(null);
    const [blogImagePreview, setBlogImagePreview] = useState<string>('');
    const blogFileInputRef = useRef<HTMLInputElement>(null);

    const navigate = useNavigate();

    // ── Data fetching ─────────────────────────────────────────────────────────
    const fetchPage = async (tab: 'orders' | 'bulkOrders' | 'users', page: number) => {
        try {
            if (tab === 'orders') {
                const data = await getOrders({ page, limit: 10 });
                const list = Array.isArray(data) ? data : (data.orders || []);
                setOrders(list);
                setPagination(prev => ({ ...prev, orders: { page, pages: data.pages || 1 } }));
            } else if (tab === 'bulkOrders') {
                const data = await getBulkOrders({ page, limit: 10 });
                const list = Array.isArray(data) ? data : (data.orders || data.bulkOrders || []);
                setBulkOrders(list);
                setPagination(prev => ({ ...prev, bulkOrders: { page, pages: data.pages || 1 } }));
            } else if (tab === 'users') {
                const data = await getUsers({ page, limit: 10 });
                const list = Array.isArray(data) ? data : (data.users || []);
                setUsers(list);
                setPagination(prev => ({ ...prev, users: { page, pages: data.pages || 1 } }));
            }
        } catch (e) { console.error(e); }
    };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [prods, cats, blogsData] = await Promise.all([
                getProducts(), getCategories(), getBlogs(true)
            ]);
            setProducts(prods);
            setCategories(cats);
            setBlogs(blogsData);
            await Promise.all([
                fetchPage('orders', 1),
                fetchPage('bulkOrders', 1),
                fetchPage('users', 1),
            ]);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        const userInfo = localStorage.getItem('adminInfo');
        if (!userInfo || !JSON.parse(userInfo).isAdmin) {
            navigate('/admin/login');
        } else {
            fetchAll();
        }
    }, [navigate]);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Selection helpers ─────────────────────────────────────────────────────
    const toggleSelection = (id: string, tab: 'orders' | 'bulkOrders') => {
        if (tab === 'orders') {
            setSelectedOrders(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
        } else {
            setSelectedBulkOrders(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
        }
    };

    const toggleAllSelection = (items: any[], tab: 'orders' | 'bulkOrders', current: Set<string>) => {
        if (tab === 'orders') {
            setSelectedOrders(current.size === items.length ? new Set() : new Set(items.map(i => i._id)));
        } else {
            setSelectedBulkOrders(current.size === items.length ? new Set() : new Set(items.map(i => i._id)));
        }
    };

    const handleBulkDelete = async (tab: 'orders' | 'bulkOrders') => {
        if (tab === 'orders') {
            if (!window.confirm(`Delete ${selectedOrders.size} orders?`)) return;
            try { await deleteOrdersBulk(Array.from(selectedOrders)); setSelectedOrders(new Set()); showToast('Orders deleted'); fetchPage('orders', pagination.orders.page); }
            catch { showToast('Failed to delete orders', 'error'); }
        } else {
            if (!window.confirm(`Delete ${selectedBulkOrders.size} bulk orders?`)) return;
            try { await deleteBulkOrdersBulk(Array.from(selectedBulkOrders)); setSelectedBulkOrders(new Set()); showToast('Bulk orders deleted'); fetchPage('bulkOrders', pagination.bulkOrders.page); }
            catch { showToast('Failed to delete bulk orders', 'error'); }
        }
    };

    const handleLogout = () => { localStorage.removeItem('adminInfo'); navigate('/admin/login'); };

    // ── Product handlers ──────────────────────────────────────────────────────
    const resetProductForm = () => {
        setProductForm({ name: '', price: '', description: '', longDescription: '', category: '', weight: '', intensity: '', inStock: true, origin: 'Sri Lanka', ingredients: '', shelfLife: '', certifications: '' });
        setPrimaryFile(null); setPrimaryPreview('');
        setGalleryFiles([]); setGalleryPreviews([]);
        setExistingGallery([]); setRemovedGalleryUrls([]);
        setVariations([]);
        setEditingProduct(null);
        setShowProductForm(false);
    };

    const handleEditProduct = (product: any) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name || '',
            price: String(product.price || ''),
            description: product.description || '',
            longDescription: product.longDescription || '',
            category: product.category || '',
            weight: product.weight || '',
            intensity: product.intensity ? String(product.intensity) : '',
            inStock: product.inStock !== false,
            origin: product.origin || 'Sri Lanka',
            ingredients: product.ingredients || '',
            shelfLife: product.shelfLife || '',
            certifications: (product.certifications || []).join(', '),
        });
        setPrimaryPreview(getImgSrc(product.image || ''));
        setPrimaryFile(null);
        setExistingGallery(product.images || []);
        setGalleryFiles([]); setGalleryPreviews([]);
        setRemovedGalleryUrls([]);
        setVariations((product.variations || []).map((v: any) => ({ label: v.label, price: String(v.price), inStock: v.inStock !== false })));
        setShowProductForm(true);
        setActiveTab('products');
    };

    const handlePrimaryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPrimaryFile(file);
        setPrimaryPreview(URL.createObjectURL(file));
    };

    const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setGalleryFiles(prev => [...prev, ...files]);
        setGalleryPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    };

    const removeNewGalleryImage = (idx: number) => {
        setGalleryFiles(prev => prev.filter((_, i) => i !== idx));
        setGalleryPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const removeExistingGalleryImage = (url: string) => {
        setExistingGallery(prev => prev.filter(u => u !== url));
        setRemovedGalleryUrls(prev => [...prev, url]);
    };

    const addVariation = () => setVariations(prev => [...prev, { label: '', price: '', inStock: true }]);
    const removeVariation = (idx: number) => setVariations(prev => prev.filter((_, i) => i !== idx));
    const updateVariation = (idx: number, field: string, value: any) =>
        setVariations(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('name', productForm.name);
        fd.append('price', productForm.price);
        fd.append('description', productForm.description);
        fd.append('longDescription', productForm.longDescription);
        fd.append('category', productForm.category);
        fd.append('weight', productForm.weight);
        if (productForm.intensity) fd.append('intensity', productForm.intensity);
        fd.append('inStock', String(productForm.inStock));
        fd.append('origin', productForm.origin);
        fd.append('ingredients', productForm.ingredients);
        fd.append('shelfLife', productForm.shelfLife);
        fd.append('certifications', JSON.stringify(
            productForm.certifications.split(',').map(s => s.trim()).filter(Boolean)
        ));
        fd.append('variations', JSON.stringify(
            variations.map(v => ({ label: v.label, price: Number(v.price), inStock: v.inStock }))
        ));
        if (primaryFile) fd.append('image', primaryFile);
        else if (editingProduct?.image) fd.append('image', editingProduct.image);
        galleryFiles.forEach(f => fd.append('images', f));
        if (removedGalleryUrls.length > 0) fd.append('removeImages', JSON.stringify(removedGalleryUrls));

        try {
            if (editingProduct) {
                await updateProduct(editingProduct._id, fd);
                showToast('Product updated successfully');
            } else {
                await createProduct(fd);
                showToast('Product created successfully');
            }
            resetProductForm();
            fetchAll();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Error saving product', 'error');
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!window.confirm('Delete this product?')) return;
        try { await deleteProduct(id); showToast('Product deleted'); fetchAll(); }
        catch { showToast('Failed to delete', 'error'); }
    };

    // ── Blog handlers ─────────────────────────────────────────────────────────
    const resetBlogForm = () => {
        setBlogForm({ title: '', excerpt: '', content: '', tags: '', author: 'Silonka Team', readTime: '5', published: false });
        setBlogImageFile(null); setBlogImagePreview(''); setEditingBlog(null); setShowBlogForm(false);
    };

    const handleEditBlog = (blog: any) => {
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
        } catch (err: any) { showToast(err.response?.data?.message || 'Error saving blog post', 'error'); }
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
        catch (err: any) { showToast(err.response?.data?.message || 'Error creating category', 'error'); }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!window.confirm('Delete this category?')) return;
        try { await deleteCategory(id); showToast('Category deleted'); fetchAll(); }
        catch { showToast('Failed to delete', 'error'); }
    };

    // ── Order handlers ────────────────────────────────────────────────────────
    const handleMarkPaid = async (id: string) => {
        try { await markOrderPaid(id, { id: 'manual', status: 'COMPLETED', update_time: new Date().toISOString(), email_address: '' }); showToast('Order marked as paid'); fetchAll(); }
        catch { showToast('Failed', 'error'); }
    };

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
        catch (err: any) { showToast(err.response?.data?.message || 'Failed', 'error'); }
    };

    const handleToggleAdmin = async (id: string, current: boolean) => {
        try { await updateUser(id, { isAdmin: !current }); showToast('User updated'); fetchPage('users', pagination.users.page); }
        catch (err: any) { showToast(err.response?.data?.message || 'Failed', 'error'); }
    };

    // ── Pagination ────────────────────────────────────────────────────────────
    const PaginationControls = ({ tab, current, total }: { tab: 'orders' | 'bulkOrders' | 'users'; current: number; total: number }) => (
        total > 1 ? (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-[#13130f]">
                <button disabled={current <= 1} onClick={() => fetchPage(tab, current - 1)} className="px-3 py-1 text-xs font-mono uppercase text-ivory-muted hover:text-ivory disabled:opacity-30">Prev</button>
                <span className="text-xs font-mono text-ivory-muted">Page {current} of {total}</span>
                <button disabled={current >= total} onClick={() => fetchPage(tab, current + 1)} className="px-3 py-1 text-xs font-mono uppercase text-ivory-muted hover:text-ivory disabled:opacity-30">Next</button>
            </div>
        ) : null
    );

    // ── Derived data ──────────────────────────────────────────────────────────
    const totalRevenue = orders.reduce((acc, o) => acc + (o.isPaid ? o.totalPrice : 0), 0);
    const pendingBulk = bulkOrders.filter(b => b.status === 'pending').length;

    const filteredProducts = products.filter(p => {
        const matchSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
        const matchCat = !productFilterCat || p.category === productFilterCat;
        return matchSearch && matchCat;
    });

    const navItems: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
        { id: 'stats', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" />, badge: products.length },
        { id: 'orders', label: 'Orders', icon: <ShoppingBag className="w-4 h-4" />, badge: orders.filter(o => !o.isDelivered).length },
        { id: 'categories', label: 'Categories', icon: <Tag className="w-4 h-4" /> },
        { id: 'bulkorders', label: 'Bulk Orders', icon: <ClipboardList className="w-4 h-4" />, badge: pendingBulk || undefined },
        { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
        { id: 'blog', label: 'Blog', icon: <BookOpen className="w-4 h-4" /> },
    ];

    return (
        <div className="flex min-h-screen bg-[#0f0f0c] text-ivory font-sans">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} transition-all duration-300 flex-shrink-0 border-r border-white/8 bg-[#13130f] flex flex-col`}>
                <div className="flex items-center justify-between p-4 border-b border-white/8 h-16">
                    {sidebarOpen && <span className="font-display text-lg text-gold tracking-widest">SILONKA</span>}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-ivory-muted hover:text-ivory transition-colors ml-auto">
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
                <nav className="flex-1 py-6 space-y-1 px-2">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); resetProductForm(); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${activeTab === item.id ? 'bg-gold/15 text-gold' : 'text-ivory-muted hover:text-ivory hover:bg-white/5'}`}
                        >
                            {item.icon}
                            {sidebarOpen && (
                                <>
                                    <span className="flex-1 text-left font-mono text-xs uppercase tracking-wider">{item.label}</span>
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <span className="bg-gold text-charcoal text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{item.badge}</span>
                                    )}
                                </>
                            )}
                        </button>
                    ))}
                </nav>
                <div className="p-3 border-t border-white/8">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-ivory-muted hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <LogOut className="w-4 h-4" />
                        {sidebarOpen && <span className="font-mono text-xs uppercase tracking-wider">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <header className="h-16 border-b border-white/8 bg-[#13130f] flex items-center justify-between px-6 flex-shrink-0">
                    <div className="flex items-center gap-2 text-ivory-muted">
                        <span className="font-mono text-xs uppercase tracking-widest">Admin</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="font-mono text-xs uppercase tracking-widest text-ivory">{navItems.find(n => n.id === activeTab)?.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {loading && <span className="font-mono text-xs text-ivory-muted animate-pulse">Loading...</span>}
                        <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
                            <span className="font-mono text-xs text-gold">A</span>
                        </div>
                    </div>
                </header>

                {/* Toast */}
                {toast && (
                    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-mono shadow-xl transition-all ${toast.type === 'success' ? 'bg-green-900/80 border-green-500/40 text-green-300' : 'bg-red-900/80 border-red-500/40 text-red-300'}`}>
                        {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {toast.msg}
                    </div>
                )}

                <main className="flex-1 p-6 overflow-auto">

                    {/* ── STATS ── */}
                    {activeTab === 'stats' && (
                        <div className="space-y-6">
                            <h1 className="font-display text-2xl font-light">Good day, Admin 👋</h1>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} sub="from paid orders" color="bg-gold" />
                                <StatCard label="Total Orders" value={orders.length} sub={`${orders.filter(o => !o.isPaid).length} pending`} />
                                <StatCard label="Products" value={products.length} sub={`${products.filter(p => p.inStock !== false).length} in stock`} />
                                <StatCard label="Bulk Inquiries" value={bulkOrders.length} sub={`${pendingBulk} pending review`} />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-white/8 bg-[#13130f] p-5">
                                    <h3 className="font-mono text-xs uppercase tracking-widest text-ivory-muted mb-4">Recent Orders</h3>
                                    <div className="space-y-3">
                                        {orders.slice(0, 5).map(o => (
                                            <div key={o._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                                <div><p className="text-sm text-ivory">{o.user?.name || 'Guest'}</p><p className="font-mono text-xs text-ivory-muted">{new Date(o.createdAt).toLocaleDateString()}</p></div>
                                                <div className="text-right"><p className="font-mono text-sm text-gold">${o.totalPrice}</p><Badge status={o.isPaid ? 'confirmed' : 'pending'} /></div>
                                            </div>
                                        ))}
                                        {orders.length === 0 && <p className="text-ivory-muted text-sm">No orders yet.</p>}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-[#13130f] p-5">
                                    <h3 className="font-mono text-xs uppercase tracking-widest text-ivory-muted mb-4">Recent Bulk Inquiries</h3>
                                    <div className="space-y-3">
                                        {bulkOrders.slice(0, 5).map(b => (
                                            <div key={b._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                                <div><p className="text-sm text-ivory">{b.companyName}</p><p className="font-mono text-xs text-ivory-muted">{b.email}</p></div>
                                                <Badge status={b.status} />
                                            </div>
                                        ))}
                                        {bulkOrders.length === 0 && <p className="text-ivory-muted text-sm">No bulk inquiries yet.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── PRODUCTS ── */}
                    {activeTab === 'products' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-display text-xl font-light">Products <span className="font-mono text-sm text-ivory-muted">({filteredProducts.length}/{products.length})</span></h2>
                                <button onClick={() => { resetProductForm(); setShowProductForm(!showProductForm); }} className="flex items-center gap-2 bg-gold text-charcoal px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-widest hover:bg-gold/90 transition-colors">
                                    {showProductForm && !editingProduct ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {showProductForm && !editingProduct ? 'Cancel' : 'Add Product'}
                                </button>
                            </div>

                            {/* ── Product Form ── */}
                            {showProductForm && (
                                <div className="mb-6 rounded-2xl border border-gold/20 bg-[#181710] p-6">
                                    <h3 className="font-display text-lg mb-6 text-gold flex items-center gap-2">
                                        {editingProduct ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                        {editingProduct ? 'Edit Product' : 'New Product'}
                                    </h3>
                                    <form onSubmit={handleProductSubmit} className="space-y-6">

                                        {/* ─ Images Section ─ */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Primary Image */}
                                            <div>
                                                <label className="block font-mono text-[11px] uppercase tracking-widest text-ivory-muted mb-2">Primary Image *</label>
                                                <div
                                                    onClick={() => primaryFileRef.current?.click()}
                                                    className="relative border-2 border-dashed border-white/15 rounded-xl cursor-pointer hover:border-gold/40 transition-colors flex items-center justify-center min-h-[140px] group overflow-hidden"
                                                >
                                                    {primaryPreview ? (
                                                        <div className="relative w-full h-full min-h-[140px]">
                                                            <img src={primaryPreview} alt="Primary" className="w-full h-40 object-cover" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <span className="text-white text-xs font-mono uppercase tracking-widest">Click to Change</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2 p-6">
                                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                                                                <Upload className="w-5 h-5 text-ivory-muted group-hover:text-gold" />
                                                            </div>
                                                            <p className="text-ivory text-sm">Click to upload primary image</p>
                                                            <p className="text-ivory-muted text-xs">PNG, JPG, WEBP up to 10MB</p>
                                                        </div>
                                                    )}
                                                    <input ref={primaryFileRef} type="file" accept="image/*" className="hidden" onChange={handlePrimaryImageChange} />
                                                </div>
                                            </div>

                                            {/* Gallery Images */}
                                            <div>
                                                <label className="block font-mono text-[11px] uppercase tracking-widest text-ivory-muted mb-2">Gallery Images (up to 9)</label>
                                                <div
                                                    onClick={() => galleryFileRef.current?.click()}
                                                    className="border-2 border-dashed border-white/15 rounded-xl cursor-pointer hover:border-gold/40 transition-colors p-3 min-h-[140px] group"
                                                >
                                                    {/* Existing gallery */}
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {existingGallery.map((url, i) => (
                                                            <div key={i} className="relative group/img">
                                                                <img src={getImgSrc(url)} alt="" className="w-16 h-16 object-cover rounded-lg border border-white/10" />
                                                                <button
                                                                    type="button"
                                                                    onClick={ev => { ev.stopPropagation(); removeExistingGalleryImage(url); }}
                                                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                                >×</button>
                                                                <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-black/60 text-white font-mono rounded-b-lg py-0.5">saved</span>
                                                            </div>
                                                        ))}
                                                        {/* New gallery previews */}
                                                        {galleryPreviews.map((url, i) => (
                                                            <div key={`new-${i}`} className="relative group/img">
                                                                <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gold/30" />
                                                                <button
                                                                    type="button"
                                                                    onClick={ev => { ev.stopPropagation(); removeNewGalleryImage(i); }}
                                                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                                >×</button>
                                                                <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-gold/70 text-charcoal font-mono rounded-b-lg py-0.5">new</span>
                                                            </div>
                                                        ))}
                                                        {existingGallery.length === 0 && galleryPreviews.length === 0 && (
                                                            <div className="flex flex-col items-center justify-center w-full py-4 gap-2">
                                                                <Images className="w-8 h-8 text-ivory-muted/30 group-hover:text-gold/50 transition-colors" />
                                                                <p className="text-ivory-muted text-xs">Click to add gallery images</p>
                                                            </div>
                                                        )}
                                                        {(existingGallery.length > 0 || galleryPreviews.length > 0) && (
                                                            <div className="w-16 h-16 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center hover:border-gold/40 transition-colors">
                                                                <Plus className="w-5 h-5 text-ivory-muted/50" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <input ref={galleryFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryImagesChange} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* ─ Basic Fields ─ */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Field label="Product Name *">
                                                <input required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className={inputCls} />
                                            </Field>
                                            <Field label="Price (USD) *">
                                                <input type="number" step="0.01" required value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} className={inputCls} />
                                            </Field>
                                            <Field label="Category *">
                                                <select required value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} className={inputCls}>
                                                    <option value="">Select category...</option>
                                                    {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                                </select>
                                            </Field>
                                            <Field label="Weight *">
                                                <input required placeholder="e.g. 100g" value={productForm.weight} onChange={e => setProductForm({ ...productForm, weight: e.target.value })} className={inputCls} />
                                            </Field>
                                            <Field label="Origin">
                                                <input value={productForm.origin} onChange={e => setProductForm({ ...productForm, origin: e.target.value })} className={inputCls} />
                                            </Field>
                                            <Field label="Intensity (0–100)">
                                                <input type="number" min={0} max={100} placeholder="Optional" value={productForm.intensity} onChange={e => setProductForm({ ...productForm, intensity: e.target.value })} className={inputCls} />
                                            </Field>
                                            <Field label="Shelf Life">
                                                <input placeholder="e.g. 24 months" value={productForm.shelfLife} onChange={e => setProductForm({ ...productForm, shelfLife: e.target.value })} className={inputCls} />
                                            </Field>
                                            <Field label="Certifications (comma-separated)">
                                                <input placeholder="Organic, ISO 22000, USDA" value={productForm.certifications} onChange={e => setProductForm({ ...productForm, certifications: e.target.value })} className={inputCls} />
                                            </Field>
                                            <div className="flex items-center gap-3 pt-2">
                                                <label className="font-mono text-[11px] uppercase tracking-widest text-ivory-muted">In Stock</label>
                                                <button type="button" onClick={() => setProductForm({ ...productForm, inStock: !productForm.inStock })} className={`relative w-11 h-6 rounded-full transition-colors ${productForm.inStock ? 'bg-green-500' : 'bg-white/20'}`}>
                                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${productForm.inStock ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </button>
                                                <span className="font-mono text-xs text-ivory-muted">{productForm.inStock ? 'Yes' : 'No'}</span>
                                            </div>
                                        </div>

                                        {/* ─ Descriptions ─ */}
                                        <Field label="Short Description *">
                                            <textarea required rows={2} value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} className={`${inputCls} resize-none`} />
                                        </Field>
                                        <Field label="Long Description / Details">
                                            <textarea rows={4} placeholder="Detailed product information, origin story, flavour profile..." value={productForm.longDescription} onChange={e => setProductForm({ ...productForm, longDescription: e.target.value })} className={`${inputCls} resize-y`} />
                                        </Field>
                                        <Field label="Ingredients">
                                            <textarea rows={2} placeholder="100% Pure Ceylon Cinnamon (Cinnamomum verum)" value={productForm.ingredients} onChange={e => setProductForm({ ...productForm, ingredients: e.target.value })} className={`${inputCls} resize-none`} />
                                        </Field>

                                        {/* ─ Variations ─ */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="font-mono text-[11px] uppercase tracking-widest text-ivory-muted">Size / Weight Variations</label>
                                                <button type="button" onClick={addVariation} className="flex items-center gap-1.5 text-gold font-mono text-xs uppercase tracking-widest hover:text-gold/80 transition-colors">
                                                    <Plus className="w-3 h-3" /> Add Variation
                                                </button>
                                            </div>
                                            {variations.length === 0 && (
                                                <p className="text-ivory-muted/50 text-xs font-mono">No variations — product uses the base price and weight above.</p>
                                            )}
                                            <div className="space-y-2">
                                                {variations.map((v, i) => (
                                                    <div key={i} className="flex items-center gap-3 bg-[#0f0f0c] rounded-xl p-3 border border-white/8">
                                                        <input
                                                            placeholder="Label (e.g. 50g)"
                                                            value={v.label}
                                                            onChange={e => updateVariation(i, 'label', e.target.value)}
                                                            className="flex-1 bg-transparent text-ivory text-sm outline-none placeholder:text-ivory-muted/30"
                                                        />
                                                        <input
                                                            type="number" step="0.01" placeholder="Price"
                                                            value={v.price}
                                                            onChange={e => updateVariation(i, 'price', e.target.value)}
                                                            className="w-24 bg-transparent text-ivory text-sm outline-none text-center placeholder:text-ivory-muted/30"
                                                        />
                                                        <button type="button" onClick={() => updateVariation(i, 'inStock', !v.inStock)} className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors ${v.inStock ? 'bg-green-500' : 'bg-white/20'}`}>
                                                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${v.inStock ? 'translate-x-4' : 'translate-x-0'}`} />
                                                        </button>
                                                        <button type="button" onClick={() => removeVariation(i)} className="text-ivory-muted hover:text-red-400 transition-colors flex-shrink-0">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* ─ Actions ─ */}
                                        <div className="flex gap-3 pt-2">
                                            <button type="submit" className="flex-1 py-3 bg-gold text-charcoal rounded-xl font-mono text-xs uppercase tracking-widest hover:bg-gold/90 transition-colors">
                                                {editingProduct ? 'Update Product' : 'Create Product'}
                                            </button>
                                            <button type="button" onClick={resetProductForm} className="px-6 py-3 rounded-xl border border-white/10 font-mono text-xs uppercase tracking-widest text-ivory-muted hover:text-ivory transition-colors">
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* ── Filter Bar ── */}
                            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-muted/40 pointer-events-none" />
                                    <input
                                        placeholder="Search products..."
                                        value={productSearch}
                                        onChange={e => setProductSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-[#13130f] border border-white/10 text-ivory rounded-xl outline-none focus:border-gold/50 text-sm"
                                    />
                                </div>
                                <select
                                    value={productFilterCat}
                                    onChange={e => setProductFilterCat(e.target.value)}
                                    className="px-4 py-2.5 bg-[#13130f] border border-white/10 text-ivory rounded-xl outline-none focus:border-gold/50 text-sm"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>

                            {/* ── Product Cards Grid ── */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredProducts.map(p => {
                                    const allImages = [p.image, ...(p.images || [])].filter(Boolean);
                                    return (
                                        <div key={p._id} className="rounded-2xl border border-white/8 bg-[#13130f] overflow-hidden group hover:border-gold/20 transition-colors">
                                            {/* Image */}
                                            <div className="relative aspect-[4/3] bg-white/5 overflow-hidden">
                                                {p.image ? (
                                                    <img src={getImgSrc(p.image)} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-ivory-muted/20" /></div>
                                                )}
                                                {/* Badges */}
                                                <div className="absolute top-2 left-2 flex gap-1.5">
                                                    <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider ${p.inStock !== false ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {p.inStock !== false ? 'In Stock' : 'Out of Stock'}
                                                    </span>
                                                </div>
                                                {allImages.length > 1 && (
                                                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                                        <Images className="w-3 h-3 text-ivory-muted" />
                                                        <span className="font-mono text-[10px] text-ivory-muted">{allImages.length}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Content */}
                                            <div className="p-4">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <p className="text-ivory font-medium text-sm line-clamp-1">{p.name}</p>
                                                    <span className="font-mono text-gold text-sm flex-shrink-0">${p.price}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-[10px] font-mono text-ivory-muted/60 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full">{p.category}</span>
                                                    <span className="text-[10px] font-mono text-ivory-muted/60">{p.weight}</span>
                                                    {p.averageRating > 0 && (
                                                        <span className="flex items-center gap-0.5 text-[10px] font-mono text-gold ml-auto">
                                                            <Star className="w-3 h-3 fill-gold" />{p.averageRating.toFixed(1)} ({p.numReviews})
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-ivory-muted/60 text-xs line-clamp-2 mb-3">{p.description}</p>
                                                {/* Actions */}
                                                <div className="flex gap-2 pt-3 border-t border-white/5">
                                                    <button onClick={() => handleEditProduct(p)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 font-mono text-[11px] uppercase transition-colors">
                                                        <Pencil className="w-3 h-3" /> Edit
                                                    </button>
                                                    <a href={`/product/${p._id}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-ivory-muted hover:text-ivory hover:bg-white/10 font-mono text-[11px] uppercase transition-colors">
                                                        View
                                                    </a>
                                                    <button onClick={() => handleDeleteProduct(p._id)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/8 text-red-400 hover:bg-red-500/15 font-mono text-[11px] uppercase transition-colors">
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredProducts.length === 0 && (
                                    <div className="col-span-3 py-20 text-center text-ivory-muted">
                                        {products.length === 0 ? 'No products yet. Add your first product above.' : 'No products match your search.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── ORDERS ── */}
                    {activeTab === 'orders' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-display text-xl font-light">Orders <span className="font-mono text-sm text-ivory-muted">({orders.length})</span></h2>
                                {selectedOrders.size > 0 && (
                                    <button onClick={() => handleBulkDelete('orders')} className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-widest flex items-center gap-2 transition-colors">
                                        <Trash2 className="w-4 h-4" /> Delete {selectedOrders.size} Selected
                                    </button>
                                )}
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-[#13130f] overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/8">
                                            <th className="w-10 px-4 py-3"><input type="checkbox" checked={selectedOrders.size === orders.length && orders.length > 0} onChange={() => toggleAllSelection(orders, 'orders', selectedOrders)} /></th>
                                            {['Order ID', 'Customer', 'Date', 'Total', 'Paid', 'Delivered', 'Actions'].map(h => (
                                                <th key={h} className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-ivory-muted">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(o => (
                                            <tr key={o._id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                                                <td className="px-4 py-3"><input type="checkbox" checked={selectedOrders.has(o._id)} onChange={() => toggleSelection(o._id, 'orders')} /></td>
                                                <td className="px-4 py-3 font-mono text-xs text-ivory-muted">{o._id.slice(-8).toUpperCase()}</td>
                                                <td className="px-4 py-3 text-ivory">{o.user?.name || 'Guest'}</td>
                                                <td className="px-4 py-3 font-mono text-xs text-ivory-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 font-mono text-gold">${o.totalPrice}</td>
                                                <td className="px-4 py-3">{o.isPaid ? <Badge status="confirmed" /> : <Badge status="pending" />}</td>
                                                <td className="px-4 py-3">{o.isDelivered ? <Badge status="confirmed" /> : <Badge status="pending" />}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1">
                                                        {!o.isPaid && (
                                                            <button onClick={() => handleMarkPaid(o._id)} className="px-2 py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 font-mono text-[10px] uppercase transition-colors">Mark Paid</button>
                                                        )}
                                                        {o.isPaid && !o.isDelivered && (
                                                            <button onClick={() => handleMarkDelivered(o._id)} className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-mono text-[10px] uppercase transition-colors">Mark Delivered</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {orders.length === 0 && <tr><td colSpan={8} className="px-5 py-10 text-center text-ivory-muted text-sm">No orders yet.</td></tr>}
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
                                <h2 className="font-display text-xl font-light">Categories <span className="font-mono text-sm text-ivory-muted">({categories.length})</span></h2>
                                <button onClick={() => setShowCategoryForm(!showCategoryForm)} className="flex items-center gap-2 bg-gold text-charcoal px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-widest hover:bg-gold/90 transition-colors">
                                    {showCategoryForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {showCategoryForm ? 'Cancel' : 'Add Category'}
                                </button>
                            </div>
                            {showCategoryForm && (
                                <div className="mb-6 rounded-2xl border border-gold/20 bg-[#181710] p-6">
                                    <h3 className="font-display text-lg mb-4 text-gold">New Category</h3>
                                    <form onSubmit={handleCreateCategory} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block font-mono text-[11px] uppercase tracking-widest text-ivory-muted mb-2">Name *</label>
                                            <input required value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} className={inputCls} />
                                        </div>
                                        <div>
                                            <label className="block font-mono text-[11px] uppercase tracking-widest text-ivory-muted mb-2">Description</label>
                                            <input value={newCategory.description} onChange={e => setNewCategory({ ...newCategory, description: e.target.value })} className={inputCls} />
                                        </div>
                                        <div className="flex items-end">
                                            <button type="submit" className="w-full py-2.5 bg-gold text-charcoal rounded-xl font-mono text-xs uppercase tracking-widest hover:bg-gold/90 transition-colors">Create</button>
                                        </div>
                                    </form>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categories.map(cat => (
                                    <div key={cat._id} className="rounded-2xl border border-white/8 bg-[#13130f] p-5 flex items-start justify-between group">
                                        <div>
                                            <p className="text-ivory font-medium">{cat.name}</p>
                                            {cat.description && <p className="text-ivory-muted text-xs mt-1">{cat.description}</p>}
                                            <p className="font-mono text-[10px] text-ivory-muted/50 mt-2">/{cat.slug}</p>
                                        </div>
                                        <button onClick={() => handleDeleteCategory(cat._id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-ivory-muted hover:text-red-400 transition-all">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {categories.length === 0 && <div className="col-span-3 py-12 text-center text-ivory-muted text-sm">No categories yet.</div>}
                            </div>
                        </div>
                    )}

                    {/* ── BULK ORDERS ── */}
                    {activeTab === 'bulkorders' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-display text-xl font-light">Bulk Orders <span className="font-mono text-sm text-ivory-muted">({bulkOrders.length})</span></h2>
                                {selectedBulkOrders.size > 0 && (
                                    <button onClick={() => handleBulkDelete('bulkOrders')} className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-widest flex items-center gap-2 transition-colors">
                                        <Trash2 className="w-4 h-4" /> Delete {selectedBulkOrders.size} Selected
                                    </button>
                                )}
                            </div>
                            <div className="space-y-4">
                                {bulkOrders.map(b => (
                                    <div key={b._id} className="rounded-2xl border border-white/8 bg-[#13130f] p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <input type="checkbox" checked={selectedBulkOrders.has(b._id)} onChange={() => toggleSelection(b._id, 'bulkOrders')} />
                                                    <h3 className="text-ivory font-medium">{b.companyName}</h3>
                                                    <Badge status={b.status} />
                                                </div>
                                                <p className="font-mono text-xs text-ivory-muted">{b.contactName} · {b.email} · {b.phone}</p>
                                                <p className="font-mono text-xs text-ivory-muted/60 mt-1">{new Date(b.createdAt).toLocaleDateString()} · Ref #{b._id.slice(-8).toUpperCase()}</p>
                                            </div>
                                            {b.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleBulkStatus(b._id, 'confirmed')} className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 font-mono text-[10px] uppercase transition-colors flex items-center gap-1"><Check className="w-3 h-3" /> Confirm</button>
                                                    <button onClick={() => handleBulkStatus(b._id, 'rejected')} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 font-mono text-[10px] uppercase transition-colors flex items-center gap-1"><X className="w-3 h-3" /> Reject</button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                            {b.products?.map((prod: any, i: number) => (
                                                <div key={i} className="bg-white/4 rounded-lg px-3 py-2">
                                                    <p className="text-ivory text-xs">{prod.productName}</p>
                                                    <p className="font-mono text-[10px] text-gold mt-0.5">{prod.quantity} units</p>
                                                </div>
                                            ))}
                                        </div>
                                        {b.notes && <p className="text-ivory-muted text-xs border-t border-white/5 pt-3 mt-2">Notes: {b.notes}</p>}
                                    </div>
                                ))}
                                <PaginationControls tab="bulkOrders" current={pagination.bulkOrders.page} total={pagination.bulkOrders.pages} />
                                {bulkOrders.length === 0 && <div className="py-16 text-center text-ivory-muted text-sm">No bulk inquiries yet.</div>}
                            </div>
                        </div>
                    )}

                    {/* ── USERS ── */}
                    {activeTab === 'users' && (
                        <div>
                            <h2 className="font-display text-xl font-light mb-6">Users <span className="font-mono text-sm text-ivory-muted">({users.length})</span></h2>
                            <div className="rounded-2xl border border-white/8 bg-[#13130f] overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/8">
                                            {['Name', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                                                <th key={h} className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-ivory-muted">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u._id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                                                <td className="px-4 py-3 text-ivory">{u.name}</td>
                                                <td className="px-4 py-3 text-ivory-muted">{u.email}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider ${u.isAdmin ? 'bg-gold/10 text-gold border-gold/20' : 'bg-white/5 text-ivory-muted border-white/10'} border`}>
                                                        {u.isAdmin ? 'Admin' : 'User'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-ivory-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleToggleAdmin(u._id, u.isAdmin)} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-xs font-mono uppercase transition-colors">Toggle Admin</button>
                                                        <button onClick={() => handleDeleteUser(u._id)} className="px-2 py-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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
                                <h2 className="font-display text-xl font-light">Blog Posts <span className="font-mono text-sm text-ivory-muted">({blogs.length})</span></h2>
                                <button onClick={() => { resetBlogForm(); setShowBlogForm(!showBlogForm); }} className="flex items-center gap-2 bg-gold text-charcoal px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-widest hover:bg-gold/90 transition-colors">
                                    {showBlogForm && !editingBlog ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {showBlogForm && !editingBlog ? 'Cancel' : 'New Post'}
                                </button>
                            </div>

                            {showBlogForm && (
                                <div className="mb-6 rounded-2xl border border-gold/20 bg-[#181710] p-6">
                                    <h3 className="font-display text-lg mb-5 text-gold">{editingBlog ? 'Edit Blog Post' : 'New Blog Post'}</h3>
                                    <form onSubmit={handleBlogSubmit} className="space-y-5">
                                        <div>
                                            <label className="block font-mono text-[11px] uppercase tracking-widest text-ivory-muted mb-2">Cover Image</label>
                                            <div onClick={() => blogFileInputRef.current?.click()} className="relative border-2 border-dashed border-white/15 rounded-xl p-6 cursor-pointer hover:border-gold/40 transition-colors flex flex-col items-center justify-center gap-3 min-h-[120px] group">
                                                {blogImagePreview ? (
                                                    <div className="flex items-center gap-4">
                                                        <img src={blogImagePreview} alt="Preview" className="w-32 h-20 object-cover rounded-lg border border-white/10" />
                                                        <p className="text-ivory-muted text-xs">Click to change image</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-gold/10 transition-colors"><Upload className="w-5 h-5 text-ivory-muted group-hover:text-gold" /></div>
                                                        <p className="text-ivory text-sm">Click to upload cover image</p>
                                                        <p className="text-ivory-muted text-xs">PNG, JPG, WEBP up to 10MB</p>
                                                    </>
                                                )}
                                                <input ref={blogFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBlogImageChange} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block font-mono text-[11px] uppercase tracking-widest text-ivory-muted mb-2">Title *</label>
                                                <input required value={blogForm.title} onChange={e => setBlogForm({ ...blogForm, title: e.target.value })} className={inputCls} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block font-mono text-[11px] uppercase tracking-widest text-ivory-muted mb-2">Excerpt / Summary *</label>
                                                <textarea required rows={2} value={blogForm.excerpt} onChange={e => setBlogForm({ ...blogForm, excerpt: e.target.value })} className={`${inputCls} resize-none`} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block font-mono text-[11px] uppercase tracking-widest text-ivory-muted mb-2">Content *</label>
                                                <p className="text-ivory-muted/60 text-xs mb-2">Use ## for headings, - for lists, &gt; for quotes.</p>
                                                <textarea required rows={14} value={blogForm.content} onChange={e => setBlogForm({ ...blogForm, content: e.target.value })} className={`${inputCls} resize-y font-mono`} placeholder="## Introduction&#10;&#10;Your article content here..." />
                                            </div>
                                            <div>
                                                <label className="block font-mono text-[11px] uppercase tracking-widest text-ivory-muted mb-2">Tags (comma separated)</label>
                                                <input value={blogForm.tags} onChange={e => setBlogForm({ ...blogForm, tags: e.target.value })} placeholder="cinnamon, recipes, health" className={inputCls} />
                                            </div>
                                            <div>
                                                <label className="block font-mono text-[11px] uppercase tracking-widest text-ivory-muted mb-2">Author</label>
                                                <input value={blogForm.author} onChange={e => setBlogForm({ ...blogForm, author: e.target.value })} className={inputCls} />
                                            </div>
                                            <div>
                                                <label className="block font-mono text-[11px] uppercase tracking-widest text-ivory-muted mb-2">Read Time (minutes)</label>
                                                <input type="number" min={1} value={blogForm.readTime} onChange={e => setBlogForm({ ...blogForm, readTime: e.target.value })} className={inputCls} />
                                            </div>
                                            <div className="flex items-center gap-3 pt-2">
                                                <label className="font-mono text-[11px] uppercase tracking-widest text-ivory-muted">Publish Now</label>
                                                <button type="button" onClick={() => setBlogForm({ ...blogForm, published: !blogForm.published })} className={`relative w-11 h-6 rounded-full transition-colors ${blogForm.published ? 'bg-green-500' : 'bg-white/20'}`}>
                                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${blogForm.published ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </button>
                                                <span className="font-mono text-xs text-ivory-muted">{blogForm.published ? 'Published' : 'Draft'}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button type="submit" className="flex-1 py-3 bg-gold text-charcoal rounded-xl font-mono text-xs uppercase tracking-widest hover:bg-gold/90 transition-colors">{editingBlog ? 'Update Post' : 'Create Post'}</button>
                                            <button type="button" onClick={resetBlogForm} className="px-6 py-3 rounded-xl border border-white/10 font-mono text-xs uppercase tracking-widest text-ivory-muted hover:text-ivory transition-colors">Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="rounded-2xl border border-white/8 bg-[#13130f] overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/8">
                                            {['Cover', 'Title', 'Tags', 'Status', 'Date', 'Actions'].map(h => (
                                                <th key={h} className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-ivory-muted">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {blogs.map(b => (
                                            <tr key={b._id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="w-14 h-10 rounded-lg overflow-hidden bg-white/5">
                                                        {b.image ? <img src={getImgSrc(b.image)} alt={b.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-ivory-muted" /></div>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-ivory text-sm font-medium line-clamp-1">{b.title}</p>
                                                    <p className="text-ivory-muted/60 text-xs font-mono mt-0.5 line-clamp-1">{b.excerpt}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {(b.tags || []).slice(0, 2).map((t: string) => (
                                                            <span key={t} className="bg-gold/10 text-gold font-mono text-[9px] uppercase px-2 py-0.5 rounded-full">{t}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full border font-mono text-[10px] uppercase tracking-wider ${b.published ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'}`}>
                                                        {b.published ? 'Published' : 'Draft'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-ivory-muted">{new Date(b.createdAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleEditBlog(b)} className="p-1.5 rounded-lg hover:bg-gold/10 text-ivory-muted hover:text-gold transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                                        <button onClick={() => handleDeleteBlog(b._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-ivory-muted hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {blogs.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-ivory-muted text-sm">No blog posts yet.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}
