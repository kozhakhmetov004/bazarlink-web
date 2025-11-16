/**
 * Links API endpoints
 */
import { apiClient } from './client';

export interface LinkResponse {
	id: number;
	supplier_id: number;
	consumer_id: number;
	status: 'pending' | 'accepted' | 'removed' | 'blocked';
	requested_by_consumer: boolean;
	request_message?: string;
	requested_at: string;
	responded_at?: string;
	created_at: string;
	updated_at?: string;
}

export interface LinkUpdateRequest {
	status?: 'pending' | 'accepted' | 'removed' | 'blocked';
}

export const linksApi = {
	async getLinks(params?: {
		supplier_id?: number;
		consumer_id?: number;
		status?: string;
		skip?: number;
		limit?: number;
	}): Promise<LinkResponse[]> {
		return apiClient.get<LinkResponse[]>('/links', { params });
	},

	async getLink(id: number): Promise<LinkResponse> {
		return apiClient.get<LinkResponse>(`/links/${id}`);
	},

	async updateLink(id: number, data: LinkUpdateRequest): Promise<LinkResponse> {
		return apiClient.put<LinkResponse>(`/links/${id}`, data);
	},
};

