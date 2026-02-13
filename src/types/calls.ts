
export interface CallRecord {
  id: string;
  contactId?: string;
  contactName: string;
  phone: string;
  type: 'incoming' | 'outgoing' | 'missed';
  status: 'completed' | 'missed' | 'declined' | 'no_answer';
  duration: number; // seconds
  startedAt: string;
  endedAt?: string;
  callType: 'voice' | 'video';
}

export interface QuickContact {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
}
