/**
 * Incidents API endpoints
 */
import { apiClient } from './client';

export type IncidentStatus = 'open' | 'in_progress' | 'resolved';

export interface IncidentResponse {
	id: number;
	order_id?: number;
	consumer_id?: number;
	supplier_id?: number;
	title: string;
	description: string;
	status: IncidentStatus;
	assigned_to_user_id?: number;
	created_by_user_id: number;
	resolution?: string;
	resolved_by_user_id?: number;
	created_at: string;
	updated_at?: string;
	resolved_at?: string;
}

export interface IncidentCreateRequest {
	order_id?: number;
	title: string;
	description: string;
	assigned_to_user_id?: number;
}

export interface IncidentUpdateRequest {
	status?: IncidentStatus;
	resolution?: string;
	assigned_to_user_id?: number;
}

export const incidentsApi = {
	async getIncidents(params?: {
		supplier_id?: number;
		status?: IncidentStatus;
		assigned_to_user_id?: number;
		skip?: number;
		limit?: number;
	}): Promise<IncidentResponse[]> {
		return apiClient.get<IncidentResponse[]>('/incidents', { params });
	},

	async getIncident(id: number): Promise<IncidentResponse> {
		return apiClient.get<IncidentResponse>(`/incidents/${id}`);
	},

	async createIncident(data: IncidentCreateRequest): Promise<IncidentResponse> {
		return apiClient.post<IncidentResponse>('/incidents', data);
	},

	async updateIncident(id: number, data: IncidentUpdateRequest): Promise<IncidentResponse> {
		return apiClient.put<IncidentResponse>(`/incidents/${id}`, data);
	},
};

