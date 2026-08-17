import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (productData: any) => void;
}

const CATEGORIES = [
    'Ceylon Cinnamon',
    'Ceylon Black Pepper',
    'Cloves and Cardamom',
    'Gift Set',
];

export default function AddProductModal({ isOpen, onClose, onSubmit }: AddProductModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        image: '',
        category: '',
        weight: '',
        intensity: ''
    });

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({ name: '', price: '', description: '', image: '', category: '', weight: '', intensity: '' });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            price: Number(formData.price),
            intensity: formData.intensity ? Number(formData.intensity) : undefined
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-charcoal-card border border-white/10 rounded-card w-full max-w-lg p-8 relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute right-6 top-6 text-ivory-muted hover:text-ivory">
                    <X className="w-5 h-5" />
                </button>
                <h2 className="font-display text-2xl text-ivory mb-6">Add New Product</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-ivory-muted font-mono text-xs uppercase mb-1">Name</label>
                        <input required className="w-full bg-charcoal border border-white/10 text-ivory p-3 rounded outline-none focus:border-gold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-ivory-muted font-mono text-xs uppercase mb-1">Price (€)</label>
                        <input type="number" step="0.01" required className="w-full bg-charcoal border border-white/10 text-ivory p-3 rounded outline-none focus:border-gold" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-ivory-muted font-mono text-xs uppercase mb-1">Description</label>
                        <textarea required className="w-full bg-charcoal border border-white/10 text-ivory p-3 rounded outline-none focus:border-gold h-24" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-ivory-muted font-mono text-xs uppercase mb-1">Image URL</label>
                        <input required placeholder="/collection_set.jpg" className="w-full bg-charcoal border border-white/10 text-ivory p-3 rounded outline-none focus:border-gold" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                    </div>

                    {/* Category — fixed dropdown matching shop page filters */}
                    <div>
                        <label className="block text-ivory-muted font-mono text-xs uppercase mb-1">Category</label>
                        <select
                            required
                            className="w-full bg-charcoal border border-white/10 text-ivory p-3 rounded outline-none focus:border-gold appearance-none cursor-pointer"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="" disabled>Select a category…</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-ivory-muted font-mono text-xs uppercase mb-1">Weight</label>
                        <input required className="w-full bg-charcoal border border-white/10 text-ivory p-3 rounded outline-none focus:border-gold" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-ivory-muted font-mono text-xs uppercase mb-1">Intensity (0-100)</label>
                        <input type="number" className="w-full bg-charcoal border border-white/10 text-ivory p-3 rounded outline-none focus:border-gold" value={formData.intensity} onChange={e => setFormData({ ...formData, intensity: e.target.value })} />
                    </div>
                    <button type="submit" className="w-full py-4 bg-gold text-charcoal font-mono uppercase mt-6 rounded hover:bg-gold-light tracking-widest transition-colors">Create Product</button>
                </form>
            </div>
        </div>
    );
}
