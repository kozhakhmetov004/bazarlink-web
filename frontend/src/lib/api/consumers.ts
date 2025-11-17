/**
 * Consumers API endpoints
 */
import { apiClient } from './client';

export interface ConsumerResponse {
	id: number;
	business_name: string;
	legal_name?: string;
	tax_id?: string;
	email: string;
	phone?: string;
	address?: string;
	city?: string;
	country: string;
	business_type?: string;
	description?: string;
	is_active: boolean;
	created_at: string;
	updated_at?: string;
}

export const consumersApi = {
	async getConsumers(params?: {
		skip?: number;
		limit?: number;
	}): Promise<ConsumerResponse[]> {
		return apiClient.get<ConsumerResponse[]>('/consumers', { params });
	},

	async getConsumer(id: number): Promise<ConsumerResponse> {
		return apiClient.get<ConsumerResponse>(`/consumers/${id}`);
	},
};

