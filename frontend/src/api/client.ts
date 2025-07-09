// src/api/client.ts

import type { Reminder } from '../types/app';

const BASE_URL = 'https://ai-powered-remainder-setting.onrender.com';

// Fetch all reminders
export const getReminders = async (): Promise<Reminder[]> => {
  const response = await fetch(`${BASE_URL}/reminders`);
  if (!response.ok) {
    throw new Error('Failed to fetch reminders');
  }
  return response.json();
};

// Toggle reminder complete/incomplete
export const toggleReminderCompletion = async (id: string): Promise<Reminder> => {
  const response = await fetch(`${BASE_URL}/reminders/${id}`, {
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

// Delete reminder
export const deleteReminder = async (id: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/reminders/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete reminder');
  }
};

// Update reminder (e.g., edit task text)
export const updateReminder = async (id: string, data: Partial<Reminder>): Promise<Reminder> => {
  const response = await fetch(`${BASE_URL}/reminders/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update reminder');
  }
  return response.json();
};
