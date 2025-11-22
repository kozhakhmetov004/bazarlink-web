/**
 * Users API endpoints
 */
import { apiClient } from './client';

export interface UserResponse {
	id: number;
	email: string;
	full_name: string;
	phone?: string;
	role: 'consumer' | 'owner' | 'manager' | 'sales_representative';
	supplier_id?: number;
	consumer_id?: number;
	is_active: boolean;
	language: string;
	created_at: string;
	updated_at?: string;
}

export interface UserCreateRequest {
	email: string;
	password: string;
	full_name: string;
	phone?: string;
	role: 'manager' | 'sales_representative';
	language?: string;
}

export interface UserUpdateRequest {
	full_name?: string;
	phone?: string;
	email?: string;
	language?: string;
	is_active?: boolean;
}

export interface OwnershipTransferRequest {
	new_owner_user_id: number;
}

export const usersApi = {
	async getUsers(params?: {
		skip?: number;
		limit?: number;
	}): Promise<UserResponse[]> {
		return apiClient.get<UserResponse[]>('/users', { params });
	},

	async getUser(id: number): Promise<UserResponse> {
		return apiClient.get<UserResponse>(`/users/${id}`);
	},

	async createUser(data: UserCreateRequest): Promise<UserResponse> {
		return apiClient.post<UserResponse>('/users', data);
	},

	async updateUser(id: number, data: UserUpdateRequest): Promise<UserResponse> {
		return apiClient.put<UserResponse>(`/users/${id}`, data);
	},

	async deleteUser(id: number): Promise<void> {
		return apiClient.delete<void>(`/users/${id}`);
	},

	async deleteSelf(): Promise<void> {
		return apiClient.delete<void>('/users/me');
	},

	async transferOwnership(data: OwnershipTransferRequest): Promise<UserResponse> {
		return apiClient.post<UserResponse>('/users/transfer-ownership', data);
	},
};

