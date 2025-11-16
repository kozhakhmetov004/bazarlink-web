/**
 * Orders API endpoints
 */
import { apiClient } from './client';

export interface OrderItemResponse {
	id: number;
	order_id: number;
	product_id: number;
	quantity: number;
	unit_price: number;
	total_price: number;
}

export interface OrderResponse {
	id: number;
	supplier_id: number;
	consumer_id: number;
	order_number: string;
	status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
	delivery_method?: string;
	delivery_address?: string;
	delivery_date?: string;
	notes?: string;
	subtotal: number;
	total: number;
	currency: string;
	items: OrderItemResponse[];
	created_at: string;
	accepted_at?: string;
	completed_at?: string;
	updated_at?: string;
}

export interface OrderUpdateRequest {
	status?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
	delivery_method?: string;
	delivery_address?: string;
	delivery_date?: string;
	notes?: string;
}

export const ordersApi = {
	async getOrders(params?: {
		supplier_id?: number;
		consumer_id?: number;
		status?: string;
		skip?: number;
		limit?: number;
	}): Promise<OrderResponse[]> {
		return apiClient.get<OrderResponse[]>('/orders', { params });
	},

	async getOrder(id: number): Promise<OrderResponse> {
		return apiClient.get<OrderResponse>(`/orders/${id}`);
	},

	async updateOrder(id: number, data: OrderUpdateRequest): Promise<OrderResponse> {
		return apiClient.put<OrderResponse>(`/orders/${id}`, data);
	},
};

