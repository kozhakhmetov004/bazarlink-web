/**
 * Products API endpoints
 */
import { apiClient } from './client';

export interface ProductResponse {
	id: number;
	name: string;
	description?: string;
	supplier_id: number;
	category_id: number; // Required - products must have a category
	price: number | string; // Backend returns Decimal as string in JSON
	discount_price?: number | string;
	currency?: string;
	unit: string;
	stock_quantity: number | string; // Backend returns Decimal as string in JSON
	min_order_quantity?: number | string;
	is_available: boolean;
	is_active: boolean;
	delivery_available?: boolean;
	pickup_available?: boolean;
	lead_time_days?: number;
	image_url?: string;
	sku?: string;
	created_at: string;
	updated_at?: string;
}

export interface ProductCreateRequest {
	name: string;
	description?: string;
	supplier_id: number;
	category_id: number; // Required - products must have a category
	price: number;
	discount_price?: number;
	currency?: string;
	unit: string;
	stock_quantity: number;
	min_order_quantity?: number;
	is_available?: boolean;
	delivery_available?: boolean;
	pickup_available?: boolean;
	lead_time_days?: number;
	image_url?: string;
	sku?: string;
}

export interface ProductUpdateRequest {
	name?: string;
	description?: string;
	category_id?: number;
	price?: number;
	discount_price?: number;
	unit?: string;
	stock_quantity?: number;
	is_available?: boolean;
	is_active?: boolean;
	delivery_available?: boolean;
	pickup_available?: boolean;
	lead_time_days?: number;
	image_url?: string;
	sku?: string;
}

export const productsApi = {
	async getProducts(params?: {
		supplier_id?: number;
		skip?: number;
		limit?: number;
	}): Promise<ProductResponse[]> {
		return apiClient.get<ProductResponse[]>('/products', { params });
	},

	async getProduct(id: number): Promise<ProductResponse> {
		return apiClient.get<ProductResponse>(`/products/${id}`);
	},

	async createProduct(data: ProductCreateRequest): Promise<ProductResponse> {
		return apiClient.post<ProductResponse>('/products', data);
	},

	async updateProduct(id: number, data: ProductUpdateRequest): Promise<ProductResponse> {
		return apiClient.put<ProductResponse>(`/products/${id}`, data);
	},

	async deleteProduct(id: number): Promise<void> {
		return apiClient.delete<void>(`/products/${id}`);
	},
};

