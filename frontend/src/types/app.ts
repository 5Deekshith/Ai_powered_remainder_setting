export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

export interface Reminder {
  _id: string;
  id?: string; // For compatibility with older reminders
  reminderId?: string; // For compatibility with older reminders
  task: string;
  reminder_time: string; // ISO string
  completed: boolean; // Add this field
  [key: string]: any; // For additional fields that might be present
}

export interface NotificationToast {
  id: number;
  task: string;
}