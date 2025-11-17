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
		role: user.role, // Map role directly - all roles are now supported
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
	// Convert Decimal strings to numbers
	const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
	const discountPrice = product.discount_price 
		? (typeof product.discount_price === 'string' ? parseFloat(product.discount_price) : product.discount_price)
		: undefined;
	const stockQuantity = typeof product.stock_quantity === 'string' 
		? parseFloat(product.stock_quantity) 
		: product.stock_quantity;
	const minOrderQuantity = product.min_order_quantity
		? (typeof product.min_order_quantity === 'string' ? parseFloat(product.min_order_quantity) : product.min_order_quantity)
		: undefined;

	return {
		id: String(product.id),
		name: product.name,
		description: product.description || '',
		categoryId: String(product.category_id), // Use category_id from backend
		price: discountPrice || price, // Display price (discount if available)
		originalPrice: price, // Always the original price
		discountPrice: discountPrice,
		discount: discountPrice ? ((price - discountPrice) / price) * 100 : 0,
		currency: product.currency || 'KZT',
		unit: product.unit,
		stock: stockQuantity,
		minOrderQuantity: minOrderQuantity,
		supplierId: String(product.supplier_id),
		imageUrl: product.image_url,
		sku: product.sku,
		leadTime: product.lead_time_days ? `${product.lead_time_days} days` : '1 day',
		deliveryAvailable: product.delivery_available ?? true,
		pickupAvailable: product.pickup_available ?? true,
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

