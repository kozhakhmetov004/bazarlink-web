/**
 * Complaints API endpoints
 */
import { apiClient } from './client';

export type ComplaintStatus = 'open' | 'in_progress' | 'escalated' | 'resolved';
export type ComplaintLevel = 'sales' | 'manager';

export interface ComplaintResponse {
	id: number;
	order_id: number;
	consumer_id: number;
	supplier_id: number;
	link_id: number;
	title: string;
	description: string;
	status: ComplaintStatus;
	level: ComplaintLevel;
	escalated_to_user_id?: number;
	escalated_by_user_id?: number;
	resolution?: string;
	resolved_by_user_id?: number;
	created_at: string;
	updated_at?: string;
	resolved_at?: string;
}

export interface ComplaintCreateRequest {
	order_id: number;
	title: string;
	description: string;
}

export interface ComplaintUpdateRequest {
	status?: ComplaintStatus;
	resolution?: string;
	level?: ComplaintLevel;
}

export interface ComplaintEscalateRequest {
	escalated_to_user_id: number;
	note?: string;
}

export const complaintsApi = {
	async getComplaints(params?: {
		supplier_id?: number;
		consumer_id?: number;
		status?: ComplaintStatus;
		level?: ComplaintLevel;
		skip?: number;
		limit?: number;
	}): Promise<ComplaintResponse[]> {
		return apiClient.get<ComplaintResponse[]>('/complaints', { params });
	},

	async getComplaint(id: number): Promise<ComplaintResponse> {
		return apiClient.get<ComplaintResponse>(`/complaints/${id}`);
	},

	async createComplaint(data: ComplaintCreateRequest): Promise<ComplaintResponse> {
		return apiClient.post<ComplaintResponse>('/complaints', data);
	},

	async updateComplaint(id: number, data: ComplaintUpdateRequest): Promise<ComplaintResponse> {
		return apiClient.put<ComplaintResponse>(`/complaints/${id}`, data);
	},

	async escalateComplaint(id: number, data: ComplaintEscalateRequest): Promise<ComplaintResponse> {
		return apiClient.post<ComplaintResponse>(`/complaints/${id}/escalate`, data);
	},
};

