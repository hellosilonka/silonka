import { useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, BookOpen, ChevronRight, ClipboardList, LayoutDashboard, Leaf, LogOut, Menu, Package, RefreshCw, ShoppingBag, Store, Tag, Users, X } from 'lucide-react';
import './admin.css';

export type AdminTab = 'stats' | 'products' | 'orders' | 'categories' | 'bulkorders' | 'users' | 'blog';
const navigation = [
  { id: 'stats', label: 'Overview', icon: LayoutDashboard, description: 'A little clarity for your day. Here is how your store is doing.' },
  { id: 'products', label: 'Products', icon: Package, description: 'Manage the products, pack sizes and prices in your collection.' },
  { id: 'orders', label: 'Orders', icon: ShoppingBag, description: 'Track payments, prepare shipments and keep customers updated.' },
  { id: 'categories', label: 'Categories', icon: Tag, description: 'Give every product a place in your collection.' },
  { id: 'bulkorders', label: 'Bulk enquiries', icon: ClipboardList, description: 'Build your next wholesale relationship. Review incoming enquiries.' },
  { id: 'users', label: 'Customers', icon: Users, description: 'Manage customer accounts and administrator access.' },
  { id: 'blog', label: 'Journal', icon: BookOpen, description: 'Stories, recipes and knowledge from the heart of your brand.' },
] as const;
type Props = { activeTab: AdminTab; onNavigate: (tab: AdminTab) => void; name: string; pendingBulk: number; loading: boolean; onRefresh: () => void; onLogout: () => void; children: ReactNode };
export default function AdminShell({ activeTab, onNavigate, name, pendingBulk, loading, onRefresh, onLogout, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = navigation.find(item => item.id === activeTab)!;
  const go = (tab: AdminTab) => { onNavigate(tab); setMobileOpen(false); };
  const sidebar = <><div className="admin-brand"><span><Leaf size={23} /></span><div><strong>SILONKA</strong><small>Store manager</small></div></div><p className="admin-nav-label">Workspace</p><nav aria-label="Admin navigation">{navigation.map(item => <button key={item.id} className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`} aria-current={activeTab === item.id ? 'page' : undefined} onClick={() => go(item.id)}><item.icon size={18} /><span>{item.label}</span>{item.id === 'bulkorders' && pendingBulk > 0 && <b>{pendingBulk}</b>}</button>)}</nav><div className="admin-sidebar-bottom"><a href="/" target="_blank" rel="noreferrer" className="admin-store-link"><Store size={17} /> View storefront <ArrowUpRight size={16} /></a><div className="admin-account"><span className="admin-avatar">{name.slice(0, 1).toUpperCase()}</span><div><strong>{name}</strong><small>Administrator</small></div><button aria-label="Sign out" title="Sign out" onClick={onLogout}><LogOut size={17} /></button></div></div></>;
  return <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}><div className="admin-workspace admin-shell"><aside className="admin-sidebar desktop-sidebar">{sidebar}</aside><Dialog.Portal><Dialog.Overlay className="admin-menu-overlay" /><Dialog.Content className="admin-sidebar open" aria-describedby={undefined}><Dialog.Title className="sr-only">Store navigation</Dialog.Title><Dialog.Close className="admin-mobile-close" aria-label="Close navigation"><X size={19} /></Dialog.Close>{sidebar}</Dialog.Content></Dialog.Portal>
    <div className="admin-main"><header className="admin-topbar"><div className="admin-breadcrumb"><Dialog.Trigger asChild><button className="admin-icon-button admin-mobile-menu" aria-label="Open navigation"><Menu size={18} /></button></Dialog.Trigger><span>Workspace</span><ChevronRight size={13} /><strong>{current.label}</strong></div><div className="admin-topbar-actions"><span>Welcome back, {name.split(' ')[0]}</span><button className="admin-button secondary" disabled={loading} onClick={onRefresh}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</button></div></header>
      <main className="admin-content" id="main-content"><div className="admin-page-heading"><div><p className="admin-eyebrow">Silonka / Store management</p><h1>{activeTab === 'stats' ? 'Your store, at a glance' : current.label}</h1><p>{current.description}</p></div><span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>{children}</main>
    </div>
  </div></Dialog.Root>;
}
