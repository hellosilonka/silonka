export interface ProductVariation { _id?: string; label: string; price: number; inStock: boolean; shippingWeightKg?: number; image?: string }
export interface AdminProduct {
  _id: string; id: string; name: string; price: number; description: string; longDescription: string;
  priceIsSample?: boolean; imageIsReference?: boolean; shippingWeightEstimated?: boolean;
  category: string; weight: string; shippingWeightKg: number; intensity?: number; inStock: boolean;
  origin: string; ingredients: string; shelfLife: string; certifications: string[];
  image: string; images: string[]; variations: ProductVariation[]; averageRating: number; numReviews: number;
}
export interface AdminOrder {
  _id: string; user?: { name: string; email: string } | null; createdAt: string; totalPrice: number;
  currency?: string; isPaid: boolean; paymentStatus?: string; isDelivered: boolean;
  shippingWeightKg?: number;
  shippingAddress?: { address: string; fullName: string; city: string; country: string; postalCode: string; phone: string };
  orderItems?: { name: string; variant?: string; qty: number }[];
  dhl?: { shipmentCreated?: boolean; shipmentCreating?: boolean; pickupConfirmed?: boolean; pickupCreating?: boolean; awbNumber?: string };
}
export interface Category { _id: string; name: string; description: string; slug: string }
export interface BulkOrder { _id: string; companyName: string; contactName: string; email: string; phone: string; notes: string; status: string; createdAt: string; products: { productName: string; quantity: number }[] }
export interface Blog { _id: string; title: string; slug: string; excerpt: string; content: string; tags: string[]; image: string; author: string; readTime: number; published: boolean; createdAt: string }
