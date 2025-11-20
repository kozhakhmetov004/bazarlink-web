/**
 * Messages API endpoints
 */
import { apiClient } from './client';

export interface MessageResponse {
	id: number;
	link_id: number;
	sender_id: number;
	receiver_id?: number;
	sales_rep_id?: number;
	content: string;
	message_type: string;
	attachment_url?: string;
	attachment_type?: string;
	product_id?: number;
	order_id?: number;
	is_read: boolean;
	read_at?: string;
	created_at: string;
	updated_at?: string;
}

export interface MessageCreateRequest {
	link_id: number;
	content?: string;
	message_type?: string;
	attachment_url?: string;
	attachment_type?: string;
	product_id?: number;
	order_id?: number;
	receiver_id?: number;
}

export const messagesApi = {
	async getMessages(linkId: number, params?: {
		skip?: number;
		limit?: number;
	}): Promise<MessageResponse[]> {
		return apiClient.get<MessageResponse[]>('/messages', {
			params: {
				link_id: linkId,
				...params
			}
		});
	},

	async createMessage(data: MessageCreateRequest): Promise<MessageResponse> {
		return apiClient.post<MessageResponse>('/messages', data);
	},

	async markMessageRead(messageId: number): Promise<MessageResponse> {
		return apiClient.put<MessageResponse>(`/messages/${messageId}/read`);
	},
};

