/**
 * Categories API endpoints
 */
import { apiClient } from './client';

export interface CategoryResponse {
	id: number;
	name: string;
	supplier_id: number;
	is_active: boolean;
	created_at: string;
	updated_at?: string;
}

export interface CategoryCreateRequest {
	name: string;
	supplier_id: number;
}

export interface CategoryUpdateRequest {
	name?: string;
	is_active?: boolean;
}

export const categoriesApi = {
	async getCategories(params?: {
		supplier_id?: number;
		skip?: number;
		limit?: number;
	}): Promise<CategoryResponse[]> {
		return apiClient.get<CategoryResponse[]>('/categories', { params });
	},

	async getCategory(id: number): Promise<CategoryResponse> {
		return apiClient.get<CategoryResponse>(`/categories/${id}`);
	},

	async createCategory(data: CategoryCreateRequest): Promise<CategoryResponse> {
		return apiClient.post<CategoryResponse>('/categories', data);
	},

	async updateCategory(id: number, data: CategoryUpdateRequest): Promise<CategoryResponse> {
		return apiClient.put<CategoryResponse>(`/categories/${id}`, data);
	},

	async deleteCategory(id: number): Promise<void> {
		return apiClient.delete<void>(`/categories/${id}`);
	},
};

