import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertCircle, ArrowLeft, Check, ImagePlus, Loader2, Package, Plus, Trash2, X } from 'lucide-react';
import { createCategory, createProduct, errorMessage, updateProduct } from '@/lib/api';
import type { AdminProduct, Category } from '@/lib/types';

type Option = { key: string; _id?: string; label: string; price: string; shippingWeightKg: string; inStock: boolean; image?: string };
type Upload = { file: File; url: string };
type Props = { product: AdminProduct | null; categories: Category[]; onCategoryCreated: (category: Category) => void; onSaved: (product: AdminProduct) => void; onClose: () => void };
const acceptedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

function Field({ id, label, hint, error, children, required }: { id: string; label: string; hint?: string; error?: string; children: ReactNode; required?: boolean }) {
  return <div className="product-field"><label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>{children}
    {error ? <p id={`${id}-help`} className="field-error">{error}</p> : hint && <p id={`${id}-help`} className="field-hint">{hint}</p>}</div>;
}

export default function ProductEditor({ product, categories, onCategoryCreated, onSaved, onClose }: Props) {
  const [form, setForm] = useState(() => ({
    name: product?.name || '', description: product?.description || '', longDescription: product?.longDescription || '',
    priceIsSample: product?.priceIsSample || false, imageIsReference: product?.imageIsReference || false, shippingWeightEstimated: product?.shippingWeightEstimated || false,
    category: product?.category || '', price: product ? String(product.price) : '', weight: product?.weight || '',
    shippingWeightKg: product ? String(product.shippingWeightKg ?? '') : '', inStock: product?.inStock !== false,
    origin: product?.origin || 'Sri Lanka', ingredients: product?.ingredients || '', shelfLife: product?.shelfLife || '',
    certifications: product?.certifications?.join(', ') || '', intensity: product?.intensity == null ? '' : String(product.intensity),
  }));
  const [options, setOptions] = useState<Option[]>(() => (product?.variations || []).map(v => ({ key: v._id || crypto.randomUUID(), _id: v._id, label: v.label, image: v.image, price: String(v.price), shippingWeightKg: v.shippingWeightKg == null ? '' : String(v.shippingWeightKg), inStock: v.inStock !== false })));
  const [primary, setPrimary] = useState<Upload | null>(null);
  const [gallery, setGallery] = useState<Upload[]>([]);
  const [retainedImages, setRetainedImages] = useState(product?.images || []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const primaryInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const saveLock = useRef(false);
  const categoryLock = useRef(false);
  const objectUrls = useRef(new Set<string>());

  useEffect(() => {
    const urls = objectUrls.current;
    return () => { urls.forEach(url => URL.revokeObjectURL(url)); };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const update = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm(previous => ({ ...previous, [key]: value })); setDirty(true);
    setErrors(previous => { const next = { ...previous }; delete next[key]; return next; });
  };
  const attributes = (id: string) => ({ id, 'aria-invalid': !!errors[id], 'aria-required': ['name', 'description', 'category', 'price', 'weight', 'shippingWeightKg'].includes(id) || id.startsWith('option-label-') || id.startsWith('option-price-'), 'aria-describedby': `${id}-help`, className: 'admin-input' });
  const release = (upload: Upload) => { URL.revokeObjectURL(upload.url); objectUrls.current.delete(upload.url); };
  const receiveFiles = (files: File[], target: 'primary' | 'gallery') => {
    const key = target === 'primary' ? 'image' : 'gallery';
    if (!files.length || busy) return;
    let message = '';
    if (files.some(file => !acceptedImages.includes(file.type))) message = 'Choose a JPG, PNG, WebP or AVIF image.';
    else if (files.some(file => file.size > 5 * 1024 * 1024)) message = 'Each image must be 5 MB or smaller.';
    else if (target === 'primary' && files.length !== 1) message = 'Choose one cover image.';
    else if (target === 'gallery' && retainedImages.length + gallery.length + files.length > 6) message = 'You can add up to 6 gallery images. Remove one before adding more.';
    if (message) { setErrors(previous => ({ ...previous, [key]: message })); return; }
    const uploads = files.map(file => { const url = URL.createObjectURL(file); objectUrls.current.add(url); return { file, url }; });
    if (target === 'primary') { if (primary) release(primary); setPrimary(uploads[0]); }
    else setGallery(previous => [...previous, ...uploads]);
    setDirty(true); setErrors(previous => { const next = { ...previous }; delete next[key]; return next; });
  };
  const changeOption = (key: string, field: keyof Option, value: string | boolean) => {
    setOptions(previous => previous.map(option => option.key === key ? { ...option, [field]: value } : option)); setDirty(true);
  };
  const close = () => { if (saveLock.current || categoryLock.current) return; if (dirty) setConfirmDiscard(true); else onClose(); };
  const validNumber = (value: string, min: number, max: number) => value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max;
  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Give your product a name.';
    if (!form.description.trim()) next.description = 'Add a short description for the shop.';
    if (!categories.some(category => category.name === form.category)) next.category = 'Choose a category, or create one below.';
    if (!validNumber(form.price, 0.01, 100000) || Math.abs(Number(form.price) * 100 - Math.round(Number(form.price) * 100)) > 0.000001) next.price = 'Enter USD 0.01 to 100,000, with up to two decimal places.';
    if (!form.weight.trim()) next.weight = 'Enter the pack size shown to customers, for example 100 g.';
    if (!validNumber(form.shippingWeightKg, 0.001, 70)) next.shippingWeightKg = 'Enter the packed weight in kg, between 0.001 and 70.';
    if (!primary && !product?.image) next.image = 'Add a cover image so customers can see the product.';
    if (retainedImages.length + gallery.length > 6) next.gallery = 'Keep up to 6 gallery images.';
    const seen = new Set<string>();
    options.forEach((option, index) => {
      const label = option.label.trim().toLowerCase();
      if (!label || seen.has(label)) next[`option-label-${index}`] = label ? 'Each option needs a different name.' : 'Name this option, for example 250 g.';
      seen.add(label);
      if (!validNumber(option.price, 0.01, 100000) || Math.abs(Number(option.price) * 100 - Math.round(Number(option.price) * 100)) > 0.000001) next[`option-price-${index}`] = 'Enter a positive price with up to two decimal places.';
      if (option.shippingWeightKg && !validNumber(option.shippingWeightKg, 0.001, 70)) next[`option-weight-${index}`] = 'Enter a packed weight between 0.001 and 70 kg.';
    });
    return next;
  };
  const addCategory = async () => {
    if (categoryLock.current) return;
    if (!newCategory.trim()) { setCategoryError('Enter a category name.'); return; }
    categoryLock.current = true; setCategoryBusy(true); setCategoryError('');
    try { const category: Category = await createCategory({ name: newCategory.trim(), description: '' }); onCategoryCreated(category); update('category', category.name); setNewCategory(''); setAddingCategory(false); }
    catch (error) { setCategoryError(errorMessage(error, 'Could not create the category. Please try again.')); }
    finally { categoryLock.current = false; setCategoryBusy(false); }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saveLock.current || categoryLock.current) return;
    const next = validate(); setErrors(next); setSaveError('');
    if (Object.keys(next).length) {
      requestAnimationFrame(() => { const field = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]'); field?.focus(); field?.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
      return;
    }
    saveLock.current = true; setBusy(true);
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, key === 'certifications' ? JSON.stringify(String(value).split(',').map(s => s.trim()).filter(Boolean)) : String(value).trim()));
    body.append('variations', JSON.stringify(options.map(option => ({ _id: option._id, label: option.label.trim(), image: option.image, price: Number(option.price), inStock: option.inStock, ...(option.shippingWeightKg ? { shippingWeightKg: Number(option.shippingWeightKg) } : {}) }))));
    if (primary) body.append('image', primary.file);
    else if (product?.image) body.append('image', product.image);
    gallery.forEach(upload => body.append('images', upload.file));
    body.append('removeImages', JSON.stringify((product?.images || []).filter(url => !retainedImages.includes(url))));
    try {
      const saved: AdminProduct = product ? await updateProduct(product._id, body) : await createProduct(body);
      setDirty(false); onSaved(saved);
    } catch (error) { setSaveError(errorMessage(error, 'Could not save this product. Your changes are still here. Please try again.')); requestAnimationFrame(() => errorRef.current?.focus()); }
    finally { saveLock.current = false; setBusy(false); }
  };

  const cover = primary?.url || product?.image;
  return <Dialog.Root open onOpenChange={open => { if (!open) close(); }}><Dialog.Portal>
    <Dialog.Overlay className="admin-dialog-overlay" />
    <Dialog.Content className="product-editor admin-workspace" onInteractOutside={event => event.preventDefault()} onEscapeKeyDown={event => { if (busy || confirmDiscard) event.preventDefault(); }}>
      <header className="editor-header"><div><p className="admin-eyebrow">Your catalogue</p><Dialog.Title>{product ? 'Edit product' : 'Add a new product'}</Dialog.Title><Dialog.Description>Bring your product to life. Fields marked * are required.</Dialog.Description></div><button type="button" className="admin-icon-button" aria-label="Close product editor" disabled={busy || categoryBusy} onClick={close}><X size={20} /></button></header>
      <form ref={formRef} onSubmit={submit} noValidate className="editor-form" aria-busy={busy}>
        <div className="editor-scroll" data-lenis-prevent><div className="editor-layout"><div className="editor-sections">
          {saveError && <div ref={errorRef} tabIndex={-1} className="admin-alert error" role="alert"><AlertCircle size={18} /><div><strong>Product not saved</strong><p>{saveError}</p></div></div>}
          {!!Object.keys(errors).length && <div className="admin-alert error" role="alert"><AlertCircle size={18} /><p>Check the highlighted fields before saving. Your changes have been kept.</p></div>}
          <fieldset disabled={busy} className="editor-section"><legend><span>01</span> Product details</legend><p className="section-description">The essentials customers see in your shop.</p>
            <Field id="name" label="Product name" required error={errors.name}><input {...attributes('name')} autoFocus maxLength={120} placeholder="e.g. Ceylon Cinnamon Quills" value={form.name} onChange={e => update('name', e.target.value)} /></Field>
            <Field id="description" label="Short description" required error={errors.description} hint={`${form.description.length}/1,000 characters. Keep it clear and easy to scan.`}><textarea {...attributes('description')} rows={3} maxLength={1000} placeholder="What makes this product special?" value={form.description} onChange={e => update('description', e.target.value)} /></Field>
            <Field id="category" label="Category" required error={errors.category}><select {...attributes('category')} value={form.category} onChange={e => update('category', e.target.value)}><option value="">Choose a category</option>{categories.map(category => <option key={category._id} value={category.name}>{category.name}</option>)}</select></Field>
            {!addingCategory ? <button type="button" className="admin-text-button" onClick={() => setAddingCategory(true)}><Plus size={15} /> Create a category</button> : <div className="inline-category"><label htmlFor="new-category">New category name</label><div className="flex gap-2"><input id="new-category" className="admin-input" maxLength={100} value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void addCategory(); } }} /><button type="button" className="admin-button secondary" disabled={categoryBusy} onClick={addCategory}>{categoryBusy ? 'Adding…' : 'Add'}</button><button type="button" className="admin-icon-button" aria-label="Cancel new category" disabled={categoryBusy} onClick={() => setAddingCategory(false)}><X size={17} /></button></div>{categoryError && <p role="alert" className="field-error">{categoryError}</p>}</div>}
          </fieldset>
          <fieldset disabled={busy} className="editor-section"><legend><span>02</span> Pricing & delivery</legend><label className="flex items-center gap-2 mb-3"><input type="checkbox" checked={form.priceIsSample} onChange={e => update('priceIsSample', e.target.checked)} /> Sample prices (not finalized)</label><label className="flex items-center gap-2 mb-3"><input type="checkbox" checked={form.shippingWeightEstimated} onChange={e => update('shippingWeightEstimated', e.target.checked)} /> Packed weights are estimates; verify before shipping</label><p className="section-description">Prices are charged in USD. Use the packed weight for accurate delivery quotes.</p><div className="editor-grid">
            <Field id="price" label="Base price (USD)" required error={errors.price} hint="Price for the standard pack."><input {...attributes('price')} type="number" step="0.01" min="0.01" max="100000" inputMode="decimal" placeholder="0.00" value={form.price} onChange={e => update('price', e.target.value)} /></Field>
            <Field id="weight" label="Pack size" required error={errors.weight} hint="Customer-facing size, e.g. 100 g or Gift box."><input {...attributes('weight')} maxLength={80} placeholder="e.g. 100 g" value={form.weight} onChange={e => update('weight', e.target.value)} /></Field>
            <Field id="shippingWeightKg" label="Packed shipping weight (kg)" required error={errors.shippingWeightKg} hint="Include product, packaging and box. 350 g = 0.35 kg."><input {...attributes('shippingWeightKg')} type="number" min="0.001" max="70" step="0.001" inputMode="decimal" placeholder="e.g. 0.350" value={form.shippingWeightKg} onChange={e => update('shippingWeightKg', e.target.value)} /></Field>
            <div className="availability-control"><label htmlFor="inStock">Availability</label><label className="check-label"><input id="inStock" type="checkbox" checked={form.inStock} onChange={e => update('inStock', e.target.checked)} /> Available to buy</label><p className="field-hint">Turn off to show “Out of stock” in your shop.</p></div>
          </div></fieldset>
          <fieldset disabled={busy} className="editor-section"><legend><span>03</span> Product images</legend><label className="flex items-center gap-2 mb-3"><input type="checkbox" checked={form.imageIsReference} onChange={e => update('imageIsReference', e.target.checked)} /> Temporary reference image</label><p className="section-description">One cover and up to 6 gallery images. JPG, PNG, WebP or AVIF, up to 5 MB each.</p>
            <div className="cover-upload" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); receiveFiles(Array.from(e.dataTransfer.files), 'primary'); }}>
              {cover ? <img src={cover} alt="Cover preview" /> : <div className="upload-placeholder"><ImagePlus size={30} /></div>}
              <div><strong>Cover image *</strong><p className="field-hint">Use a clear, well-lit photo. A square image works best.</p><button type="button" id="image" aria-invalid={!!errors.image} aria-describedby="image-help" className="admin-button secondary" onClick={() => primaryInput.current?.click()}><ImagePlus size={16} />{cover ? 'Change cover' : 'Upload cover'}</button><span className="upload-drop-hint">or drop an image here</span></div>
            </div><input ref={primaryInput} type="file" aria-label="Upload cover image" accept={acceptedImages.join(',')} className="sr-only" tabIndex={-1} onChange={e => { receiveFiles(Array.from(e.target.files || []), 'primary'); e.target.value = ''; }} />
            {errors.image && <p id="image-help" className="field-error">{errors.image}</p>}
            <div className="gallery-heading"><label>Gallery <span>{retainedImages.length + gallery.length}/6</span></label><button type="button" className="admin-text-button" disabled={retainedImages.length + gallery.length >= 6} onClick={() => galleryInput.current?.click()}><Plus size={15} /> Add images</button></div>
            <input ref={galleryInput} type="file" aria-label="Upload gallery images" accept={acceptedImages.join(',')} multiple className="sr-only" tabIndex={-1} onChange={e => { receiveFiles(Array.from(e.target.files || []), 'gallery'); e.target.value = ''; }} />
            <div className="gallery-grid">{retainedImages.map((url, index) => <div key={url} className="gallery-image"><img src={url} alt={`Gallery image ${index + 1}`} /><button type="button" aria-label={`Remove gallery image ${index + 1}`} onClick={() => { setRetainedImages(previous => previous.filter(item => item !== url)); setDirty(true); }}><X size={14} /></button></div>)}{gallery.map((upload, index) => <div key={upload.url} className="gallery-image"><img src={upload.url} alt={`New gallery image ${index + 1}`} /><button type="button" aria-label={`Remove new gallery image ${index + 1}`} onClick={() => { release(upload); setGallery(previous => previous.filter(item => item !== upload)); setDirty(true); }}><X size={14} /></button></div>)}</div>
            {!retainedImages.length && !gallery.length && <p className="gallery-empty">Extra angles and packaging photos help customers choose.</p>}{errors.gallery && <p className="field-error" role="alert">{errors.gallery}</p>}
          </fieldset>
          <fieldset disabled={busy} className="editor-section"><legend><span>04</span> Size & pack options <small>Optional</small></legend><p className="section-description">Offer additional sizes with their own price and availability. Leave an option’s packed weight blank to use the base weight.</p>
            {options.map((option, index) => <div className="option-card" key={option.key}><div className="option-header"><strong>Option {index + 1}</strong><button type="button" className="admin-icon-button danger" aria-label={`Remove option ${index + 1}`} onClick={() => { setOptions(previous => previous.filter(item => item.key !== option.key)); setDirty(true); }}><Trash2 size={16} /></button></div><div className="editor-grid">
              <Field id={`option-label-${index}`} label="Option name" required error={errors[`option-label-${index}`]}><input {...attributes(`option-label-${index}`)} maxLength={80} value={option.label} placeholder="e.g. 250 g" onChange={e => changeOption(option.key, 'label', e.target.value)} /></Field>
              <Field id={`option-price-${index}`} label="Option price (USD)" required error={errors[`option-price-${index}`]}><input {...attributes(`option-price-${index}`)} type="number" min="0.01" max="100000" step="0.01" value={option.price} onChange={e => changeOption(option.key, 'price', e.target.value)} /></Field>
              <Field id={`option-weight-${index}`} label="Option packed weight (kg)" error={errors[`option-weight-${index}`]} hint="Optional; overrides the base packed weight."><input {...attributes(`option-weight-${index}`)} type="number" min="0.001" max="70" step="0.001" value={option.shippingWeightKg} placeholder={form.shippingWeightKg || 'Use base weight'} onChange={e => changeOption(option.key, 'shippingWeightKg', e.target.value)} /></Field>
              <label className="check-label"><input type="checkbox" checked={option.inStock} onChange={e => changeOption(option.key, 'inStock', e.target.checked)} /> Option {index + 1} available</label>
            </div></div>)}<button type="button" className="admin-button secondary" disabled={options.length >= 20} onClick={() => { setOptions(previous => [...previous, { key: crypto.randomUUID(), label: '', price: '', shippingWeightKg: '', inStock: true }]); setDirty(true); }}><Plus size={16} /> Add option</button>
          </fieldset>
          <details className="editor-section more-details"><summary>More product information <span>Optional</span></summary><div className="optional-fields"><fieldset disabled={busy}>
            <Field id="longDescription" label="Full description" hint="Shown on the product page."><textarea {...attributes('longDescription')} rows={5} maxLength={12000} value={form.longDescription} onChange={e => update('longDescription', e.target.value)} /></Field><div className="editor-grid">
              <Field id="origin" label="Origin"><input {...attributes('origin')} maxLength={100} value={form.origin} onChange={e => update('origin', e.target.value)} /></Field><Field id="shelfLife" label="Shelf life"><input {...attributes('shelfLife')} maxLength={100} placeholder="e.g. 24 months" value={form.shelfLife} onChange={e => update('shelfLife', e.target.value)} /></Field>
            </div><Field id="ingredients" label="Ingredients"><input {...attributes('ingredients')} maxLength={1000} value={form.ingredients} onChange={e => update('ingredients', e.target.value)} /></Field><Field id="certifications" label="Certifications" hint="Separate with commas. Only include certifications you hold."><input {...attributes('certifications')} maxLength={1000} placeholder="e.g. Organic, Fair Trade" value={form.certifications} onChange={e => update('certifications', e.target.value)} /></Field><Field id="intensity" label="Intensity (1–5)"><select {...attributes('intensity')} value={form.intensity} onChange={e => update('intensity', e.target.value)}><option value="">Not specified</option>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}</option>)}</select></Field>
          </fieldset></div></details>
        </div><aside className="editor-preview"><p className="admin-eyebrow">Live preview</p><div className="preview-product">{cover ? <img src={cover} alt="Product preview" /> : <div className="preview-empty"><Package size={40} /><span>Your product photo</span></div>}<div className="preview-copy"><span className="admin-eyebrow">{form.category || 'Category'}</span><h3>{form.name || 'Your product name'}</h3><p>{form.weight || 'Pack size'}</p><div className="preview-price"><strong>USD {(Number(form.price) || 0).toFixed(2)}</strong><span className={`admin-status ${form.inStock ? 'positive' : 'neutral'}`}>{form.inStock ? 'In stock' : 'Out of stock'}</span></div></div></div><div className="editor-tip"><Check size={17} /><p>Clear photos, a helpful description and accurate delivery details make a product ready to sell.</p></div></aside></div></div>
        <footer className="editor-footer"><p><span className={`save-indicator ${dirty ? 'dirty' : ''}`} />{busy ? 'Saving your product…' : dirty ? 'Unsaved changes' : 'No unsaved changes'}</p><div><button type="button" className="admin-button secondary" disabled={busy || categoryBusy} onClick={close}><ArrowLeft size={16} /> Cancel</button><button type="submit" className="admin-button primary" disabled={busy || categoryBusy}>{busy ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}{busy ? 'Saving…' : product ? 'Save changes' : 'Create product'}</button></div></footer>
      </form>
      <Dialog.Root open={confirmDiscard} onOpenChange={setConfirmDiscard}><Dialog.Portal><Dialog.Overlay className="admin-dialog-overlay discard-overlay" /><Dialog.Content className="discard-dialog admin-workspace"><Dialog.Title>Discard your changes?</Dialog.Title><Dialog.Description>Your product has not been saved. Keep editing to finish it, or discard these changes.</Dialog.Description><div><button className="admin-button secondary" onClick={() => setConfirmDiscard(false)}>Keep editing</button><button className="admin-button danger" onClick={onClose}>Discard changes</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
