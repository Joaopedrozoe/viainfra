
export interface BroadcastList {
  id: string;
  name: string;
  description?: string;
  contactIds: string[];
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export interface BroadcastTemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  components: BroadcastTemplateComponent[];
}

export interface BroadcastTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  text?: string;
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
}

export interface BroadcastSend {
  id: string;
  listId: string;
  templateId: string;
  templateName: string;
  sentAt: string;
  totalRecipients: number;
  delivered: number;
  read: number;
  failed: number;
  status: 'sending' | 'completed' | 'partial' | 'failed';
}

export interface BroadcastRecipientStatus {
  contactId: string;
  contactName: string;
  phone: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  errorMessage?: string;
}
