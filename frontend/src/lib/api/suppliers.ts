/**
 * Suppliers API endpoints
 */
import { apiClient } from './client';

export interface SupplierResponse {
	id: number;
	company_name: string;
	legal_name?: string;
	tax_id?: string;
	verification_status: 'pending' | 'verified' | 'rejected';
	email: string;
	phone?: string;
	address?: string;
	city?: string;
	country: string;
	description?: string;
	website?: string;
	is_active: boolean;
	created_at: string;
	updated_at?: string;
}

export interface SupplierCreateRequest {
	company_name: string;
	legal_name?: string;
	email: string;
	phone?: string;
	address?: string;
	city?: string;
	country?: string;
	description?: string;
	website?: string;
}

export interface SupplierUpdateRequest {
	company_name?: string;
	legal_name?: string;
	email?: string;
	phone?: string;
	address?: string;
	city?: string;
	country?: string;
	description?: string;
	website?: string;
	is_active?: boolean;
}

export const suppliersApi = {
	async createSupplier(data: SupplierCreateRequest): Promise<SupplierResponse> {
		return apiClient.post<SupplierResponse>('/suppliers', data);
	},
	async getSuppliers(params?: {
		skip?: number;
		limit?: number;
	}): Promise<SupplierResponse[]> {
		return apiClient.get<SupplierResponse[]>('/suppliers', { params });
	},

	async getSupplier(id: number): Promise<SupplierResponse> {
		return apiClient.get<SupplierResponse>(`/suppliers/${id}`);
	},

	async updateSupplier(id: number, data: SupplierUpdateRequest): Promise<SupplierResponse> {
		return apiClient.put<SupplierResponse>(`/suppliers/${id}`, data);
	},
};

