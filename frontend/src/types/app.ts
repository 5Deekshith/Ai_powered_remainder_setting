export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

export interface Reminder {
  _id: string;
  task: string;
  reminder_time: string; // ISO string
  completed: boolean; // Add this field
}

export interface NotificationToast {
  id: number;
  task: string;
}