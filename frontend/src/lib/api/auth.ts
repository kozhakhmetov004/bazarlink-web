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
		
		console.log('[authApi.login] Starting login request', {
			url: loginUrl,
			username: credentials.username,
			hasPassword: !!credentials.password
		});
		
		try {
			console.log('[authApi.login] Sending fetch request to:', loginUrl);
			const response = await fetch(loginUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: formData,
			});
			
			console.log('[authApi.login] Response received', {
				status: response.status,
				statusText: response.statusText,
				ok: response.ok
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ detail: response.statusText }));
				const errorMessage = error.detail || 'Login failed';
				
				// 401 and 403 are expected errors (wrong credentials) - don't log as error
				if (response.status === 401 || response.status === 403) {
					console.log('Login failed: Invalid credentials');
					throw new Error(errorMessage);
				}
				
				// Other errors (500, network, etc.) are unexpected - log as error
				console.error('Unexpected login error:', {
					status: response.status,
					message: errorMessage
				});
				throw new Error(errorMessage);
			}

			const data: LoginResponse = await response.json();
			console.log('[authApi.login] Login successful, token received');
			apiClient.setToken(data.access_token);
			return data;
		} catch (error: any) {
			console.error('[authApi.login] Error occurred:', {
				error,
				message: error?.message,
				stack: error?.stack
			});
			// Re-throw if it's already an Error with message
			if (error instanceof Error) {
				throw error;
			}
			// Network errors or other unexpected errors
			console.error('Network or unexpected error during login:', error);
			throw new Error('Unable to connect to server. Please check your connection.');
		}
	},

	async getCurrentUser(): Promise<UserResponse> {
		return apiClient.get<UserResponse>('/auth/me');
	},

	async registerOwner(data: OwnerRegistrationRequest): Promise<UserResponse> {
		console.log('authApi.registerOwner() called with:', {
			email: data.email,
			full_name: data.full_name,
			supplier_name: data.supplier.company_name
		});
		
		try {
			const response = await apiClient.post<UserResponse>('/auth/register-owner', data);
			console.log('Registration API response received:', {
				userId: response.id,
				email: response.email,
				supplierId: response.supplier_id
			});
			return response;
		} catch (error: any) {
			const errorMessage = error?.message || 'Registration failed';
			
			// Handle expected errors (400, 409) - don't log as error
			if (errorMessage.includes('already exists') || 
			    errorMessage.includes('Missing required')) {
				console.log('Registration validation error:', errorMessage);
				throw error;
			}
			
			// Unexpected errors (500, network) - log as error
			console.error('Unexpected registration error:', {
				message: errorMessage,
				error
			});
			throw error;
		}
	},

	logout() {
		console.log('authApi.logout() called - clearing token from API client');
		apiClient.setToken(null);
		console.log('Token cleared from API client');
	},
};

