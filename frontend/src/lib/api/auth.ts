/**
 * Authentication API endpoints
 */
import { apiClient } from './client';

export interface LoginRequest {
	username: string; // email
	password: string;
}

export interface LoginResponse {
	access_token: string;
	token_type: string;
}

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

export interface OwnerRegistrationRequest {
	email: string;
	password: string;
	full_name: string;
	phone?: string;
	language?: string;
	supplier: {
		company_name: string;
		legal_name?: string;
		tax_id?: string;
		email: string;
		phone?: string;
		address?: string;
		city?: string;
		country?: string;
		description?: string;
		website?: string;
	};
}

export const authApi = {
	async login(credentials: LoginRequest): Promise<LoginResponse> {
		const formData = new URLSearchParams();
		formData.append('username', credentials.username);
		formData.append('password', credentials.password);

		const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
		const loginUrl = `${API_BASE_URL}/api/v1/auth/login`;
		
		try {
			const response = await fetch(loginUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: formData,
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ detail: response.statusText }));
				const errorMessage = error.detail || 'Login failed';
				throw new Error(errorMessage);
			}

			const data: LoginResponse = await response.json();
			apiClient.setToken(data.access_token);
			return data;
		} catch (error: any) {
			// Re-throw if it's already an Error with message
			if (error instanceof Error) {
				throw error;
			}
			// Network errors or other unexpected errors
			throw new Error('Unable to connect to server. Please check your connection.');
		}
	},

	async getCurrentUser(): Promise<UserResponse> {
		return apiClient.get<UserResponse>('/auth/me');
	},

	async registerOwner(data: OwnerRegistrationRequest): Promise<UserResponse> {
		try {
			const response = await apiClient.post<UserResponse>('/auth/register-owner', data);
			return response;
		} catch (error: any) {
			throw error;
		}
	},

	logout() {
		apiClient.setToken(null);
	},
};

