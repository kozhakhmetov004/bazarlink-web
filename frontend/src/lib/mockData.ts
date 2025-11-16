import type { User, Supplier, Category, Product, LinkRequest, Order } from './types';

// Mock users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'owner@supplier.com',
    name: 'John Owner',
    role: 'owner',
    supplierId: 'supplier-1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-2',
    email: 'manager@supplier.com',
    name: 'Jane Manager',
    role: 'manager',
    supplierId: 'supplier-1',
    createdAt: new Date().toISOString(),
  },
];

// Mock supplier
export const mockSupplier: Supplier = {
  id: 'supplier-1',
  name: 'Fresh Foods Wholesale',
  description: 'Premium quality food supplier for restaurants and businesses',
  ownerId: 'user-1',
  contactEmail: 'contact@freshfoods.com',
  contactPhone: '+1 (555) 123-4567',
  address: '123 Supplier Street, Food City, FC 12345',
  createdAt: new Date().toISOString(),
};

// Mock categories
export const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Vegetables',
    description: 'Fresh vegetables',
    supplierId: 'supplier-1',
  },
  {
    id: 'cat-2',
    name: 'Fruits',
    description: 'Fresh fruits',
    supplierId: 'supplier-1',
  },
  {
    id: 'cat-3',
    name: 'Dairy',
    description: 'Dairy products',
    supplierId: 'supplier-1',
  },
];

// Mock products
export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Organic Tomatoes',
    description: 'Fresh organic tomatoes',
    categoryId: 'cat-1',
    price: 3.99,
    unit: 'kg',
    stock: 500,
    discount: 0,
    supplierId: 'supplier-1',
    leadTime: '24 hours',
    deliveryAvailable: true,
    pickupAvailable: true,
  },
  {
    id: 'prod-2',
    name: 'Fresh Lettuce',
    description: 'Crisp green lettuce',
    categoryId: 'cat-1',
    price: 2.49,
    unit: 'kg',
    stock: 300,
    discount: 10,
    supplierId: 'supplier-1',
    leadTime: '24 hours',
    deliveryAvailable: true,
    pickupAvailable: true,
  },
  {
    id: 'prod-3',
    name: 'Red Apples',
    description: 'Sweet red apples',
    categoryId: 'cat-2',
    price: 4.99,
    unit: 'kg',
    stock: 400,
    discount: 0,
    supplierId: 'supplier-1',
    leadTime: '48 hours',
    deliveryAvailable: true,
    pickupAvailable: false,
  },
  {
    id: 'prod-4',
    name: 'Fresh Milk',
    description: 'Whole milk',
    categoryId: 'cat-3',
    price: 5.99,
    unit: 'liter',
    stock: 200,
    discount: 5,
    supplierId: 'supplier-1',
    leadTime: '12 hours',
    deliveryAvailable: true,
    pickupAvailable: true,
  },
];

// Mock link requests
export const mockLinkRequests: LinkRequest[] = [
  {
    id: 'link-1',
    userId: 'consumer-1',
    userName: 'Restaurant ABC',
    userEmail: 'restaurant@abc.com',
    supplierId: 'supplier-1',
    status: 'pending',
    requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'link-2',
    userId: 'consumer-2',
    userName: 'Cafe XYZ',
    userEmail: 'cafe@xyz.com',
    supplierId: 'supplier-1',
    status: 'pending',
    requestedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'link-3',
    userId: 'consumer-3',
    userName: 'Hotel Grand',
    userEmail: 'hotel@grand.com',
    supplierId: 'supplier-1',
    status: 'approved',
    requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    reviewedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    reviewedBy: 'user-1',
  },
];

// Mock orders
export const mockOrders: Order[] = [
  {
    id: 'order-1',
    consumerId: 'consumer-3',
    consumerName: 'Hotel Grand',
    supplierId: 'supplier-1',
    items: [
      {
        productId: 'prod-1',
        productName: 'Organic Tomatoes',
        quantity: 50,
        price: 3.99,
      },
      {
        productId: 'prod-4',
        productName: 'Fresh Milk',
        quantity: 30,
        price: 5.99,
      },
    ],
    totalAmount: 379.20,
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];
