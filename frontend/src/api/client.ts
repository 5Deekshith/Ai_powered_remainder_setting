import type { Reminder } from '../types/app';

export const getReminders = async (): Promise<Reminder[]> => {
  const response = await fetch('https://ai-powered-remainder-setting.onrender.com/reminders');
  console.log('Fetching reminders from API', response);
  if (!response.ok) {
    throw new Error('Failed to fetch reminders');
  }
  return response.json();
};

export const toggleReminderCompletion = async (id: string): Promise<Reminder> => {
  const response = await fetch(`https://ai-powered-remainder-setting.onrender.com/reminders/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to update reminder');
  }
  return response.json();
};