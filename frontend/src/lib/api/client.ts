/**
 * API Client for backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface RequestOptions extends RequestInit {
	params?: Record<string, string | number | boolean | null | undefined>;
}

class ApiClient {
	public readonly baseUrl: string;
	private token: string | null = null;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
		// Load token from localStorage
		if (typeof window !== 'undefined') {
			this.token = localStorage.getItem('auth_token');
		}
	}

	setToken(token: string | null) {
		this.token = token;
		if (typeof window !== 'undefined') {
			if (token) {
				localStorage.setItem('auth_token', token);
			} else {
				localStorage.removeItem('auth_token');
			}
		}
	}

	private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | null | undefined>): string {
		// Handle both absolute and relative URLs
		let url: URL;
		if (this.baseUrl.startsWith('http')) {
			url = new URL(`${this.baseUrl}${endpoint}`);
		} else {
			url = new URL(`${this.baseUrl}${endpoint}`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000');
		}
		
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== null && value !== undefined) {
					url.searchParams.append(key, String(value));
				}
			});
		}
		
		return url.toString();
	}

	private async request<T>(
		endpoint: string,
		options: RequestOptions = {}
	): Promise<T> {
		const { params, ...fetchOptions } = options;
		
		const url = this.buildUrl(endpoint, params);
		
		const headers: HeadersInit = {
			'Content-Type': 'application/json',
			...fetchOptions.headers,
		};

		if (this.token) {
			headers['Authorization'] = `Bearer ${this.token}`;
		}

		const response = await fetch(url, {
			...fetchOptions,
			headers,
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ detail: response.statusText }));
			const errorMessage = error.detail || `HTTP error! status: ${response.status}`;
			
			// Only log unexpected errors (5xx, network issues)
			// 4xx errors (401, 403, 400) are expected user/client errors
			if (response.status >= 500) {
				console.error('Server error:', {
					status: response.status,
					endpoint: url,
					message: errorMessage
				});
			} else if (response.status === 0) {
				console.error('Network error - unable to reach server:', url);
			}
			
			throw new Error(errorMessage);
		}

		// Handle empty responses
		if (response.status === 204 || response.headers.get('content-length') === '0') {
			return null as T;
		}

		return response.json();
	}

	async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: 'GET' });
	}

	async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
		return this.request<T>(endpoint, {
			...options,
			method: 'POST',
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
		return this.request<T>(endpoint, {
			...options,
			method: 'PUT',
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: 'DELETE' });
	}
}

export const apiClient = new ApiClient(API_BASE_URL);

