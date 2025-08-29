
export type EventStatus = "confirmed" | "tentative" | "cancelled";
export type EventChannel = "Interno" | "Videochamada" | "Telefone";
export type ReminderTime = 5 | 10 | 15 | 30 | 60;
export type CalendarView = "day" | "week" | "month";
export type WeekDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export type BookingDuration = 15 | 30 | 60;

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO date string
  end: string; // ISO date string
  channel: EventChannel;
  description?: string;
  location?: string;
  reminderMinutes: ReminderTime;
  isFromGoogle?: boolean;
  status: EventStatus;
  color?: string;
}

export interface BookingSettings {
  availableDays: WeekDay[];
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  defaultDuration: BookingDuration;
  minInterval: number; // minutes between bookings
}

export interface BookingRequest {
  name: string;
  email: string;
  phone: string;
  message?: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  companyId: string;
}

export interface NotificationSettings {
  whatsapp: boolean;
  email: boolean;
  sms: boolean;
  reminderMinutes: ReminderTime;
}

export interface UserPermission {
  userId: string;
  userName: string;
  canView: boolean;
  canEdit: boolean;
}
