/**
 * Type mappers to convert backend API responses to frontend types
 */
import type { User, Supplier, Product, LinkRequest, Order } from '../types';
import type { UserResponse, SupplierResponse, ProductResponse, LinkResponse, OrderResponse } from '../api';

export function mapUser(user: UserResponse): User {
	return {
		id: String(user.id),
		email: user.email,
		name: user.full_name,
		role: user.role === 'owner' || user.role === 'manager' ? user.role : 'owner', // Map to frontend role type
		supplierId: user.supplier_id ? String(user.supplier_id) : '',
		createdAt: user.created_at,
	};
}

export function mapSupplier(supplier: SupplierResponse): Supplier {
	return {
		id: String(supplier.id),
		name: supplier.company_name,
		description: supplier.description || '',
		ownerId: '', // Will be set from user
		contactEmail: supplier.email,
		contactPhone: supplier.phone || '',
		address: supplier.address || '',
		createdAt: supplier.created_at,
	};
}

export function mapProduct(product: ProductResponse): Product {
	return {
		id: String(product.id),
		name: product.name,
		description: product.description,
		categoryId: product.category || '', // Backend doesn't have category_id, using category string
		price: product.discount_price || product.price,
		unit: product.unit,
		stock: product.stock_quantity,
		discount: product.discount_price ? ((product.price - product.discount_price) / product.price) * 100 : 0,
		supplierId: String(product.supplier_id),
		imageUrl: product.image_url,
		leadTime: '24 hours', // Default, backend doesn't have this field
		deliveryAvailable: product.is_available,
		pickupAvailable: product.is_available, // Default
	};
}

export function mapLink(link: LinkResponse, consumerName?: string, consumerEmail?: string): LinkRequest {
	return {
		id: String(link.id),
		userId: String(link.consumer_id),
		userName: consumerName || `Consumer ${link.consumer_id}`,
		userEmail: consumerEmail || '',
		supplierId: String(link.supplier_id),
		status: link.status === 'accepted' ? 'approved' : link.status === 'removed' ? 'rejected' : link.status,
		requestedAt: link.requested_at,
		reviewedAt: link.responded_at,
		reviewedBy: undefined, // Backend doesn't track this
	};
}

export function mapOrder(order: OrderResponse, consumerName?: string): Order {
	return {
		id: String(order.id),
		consumerId: String(order.consumer_id),
		consumerName: consumerName || `Consumer ${order.consumer_id}`,
		supplierId: String(order.supplier_id),
		items: order.items.map(item => ({
			productId: String(item.product_id),
			productName: '', // Will be filled by component
			quantity: item.quantity,
			price: item.unit_price,
		})),
		totalAmount: order.total,
		status: order.status === 'accepted' ? 'accepted' : order.status === 'cancelled' ? 'rejected' : order.status,
		createdAt: order.created_at,
	};
}

