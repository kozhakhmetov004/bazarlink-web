/**
 * Products API endpoints
 */
import { apiClient } from './client';

export interface ProductResponse {
	id: number;
	name: string;
	description: string;
	supplier_id: number;
	price: number;
	discount_price?: number;
	unit: string;
	stock_quantity: number;
	category?: string;
	is_available: boolean;
	is_active: boolean;
	image_url?: string;
	created_at: string;
	updated_at?: string;
}

export interface ProductCreateRequest {
	name: string;
	description: string;
	supplier_id: number;
	price: number;
	discount_price?: number;
	unit: string;
	stock_quantity: number;
	category?: string;
	is_available?: boolean;
	image_url?: string;
}

export interface ProductUpdateRequest {
	name?: string;
	description?: string;
	price?: number;
	discount_price?: number;
	unit?: string;
	stock_quantity?: number;
	category?: string;
	is_available?: boolean;
	is_active?: boolean;
	image_url?: string;
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

