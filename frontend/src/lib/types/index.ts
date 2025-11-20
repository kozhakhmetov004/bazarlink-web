export type UserRole = 'owner' | 'manager' | 'sales_representative' | 'consumer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  supplierId: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  supplierId: string;
  imageUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number; // Display price (discount_price if available, otherwise price)
  originalPrice: number; // Original price before discount
  discountPrice?: number; // Discount price if available
  discount: number; // Discount percentage
  currency: string;
  unit: string;
  stock: number;
  minOrderQuantity?: number;
  supplierId: string;
  imageUrl?: string;
  sku?: string;
  leadTime: string; // Product-specific lead time or supplier default
}

export interface LinkRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  supplierId: string;
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Order {
  id: string;
  consumerId: string;
  consumerName: string;
  supplierId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

