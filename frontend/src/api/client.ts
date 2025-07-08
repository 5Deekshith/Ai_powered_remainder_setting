import type { Reminder } from '../types/app';

export const getReminders = async (): Promise<Reminder[]> => {
  const response = await fetch('http://localhost:8000/reminders');
  if (!response.ok) {
    throw new Error('Failed to fetch reminders');
  }
  return response.json();
};

export const toggleReminderCompletion = async (id: string): Promise<Reminder> => {
  const response = await fetch(`http://localhost:8000/reminders/${id}`, {
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