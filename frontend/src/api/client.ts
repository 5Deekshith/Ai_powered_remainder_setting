import type { Reminder } from '../types/app';

export const getReminders = async (): Promise<Reminder[]> => {
  const response = await fetch('https://ai-powered-remainder-setting.onrender.com/reminders');
  console.log('Fetching reminders from API', response);
  if (!response.ok) {
    throw new Error('Failed to fetch reminders');
  }
  const reminders = await response.json();
  console.log('Reminders received:', JSON.stringify(reminders, null, 2)); // Detailed debug log
  return reminders;
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

export const deleteAllReminders = async (): Promise<void> => {
  try {
    // Fetch all reminders to get their IDs
    const reminders = await getReminders();
    if (reminders.length === 0) {
      console.log('No reminders to delete.');
      return;
    }

    // Validate and filter reminders with valid ID (try 'id', '_id', 'reminderId')
    const validReminders = reminders.filter((reminder) => {
      const reminderId = reminder.id || reminder._id || reminder.reminderId;
      if (!reminderId || typeof reminderId !== 'string') {
        console.warn('Skipping reminder with invalid ID:', JSON.stringify(reminder, null, 2));
        return false;
      }
      return true;
    });

    if (validReminders.length === 0) {
      console.log('No valid reminders to delete.');
      return;
    }

    // Send DELETE request for each valid reminder
    const deletePromises = validReminders.map((reminder) => {
      const reminderId = reminder.id || reminder._id || reminder.reminderId;
      return fetch(`https://ai-powered-remainder-setting.onrender.com/api/reminders/${reminderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // Uncomment and add token if authentication is required
          // 'Authorization': `Bearer ${localStorage.getItem('token') || 'your-token-here'}`,
        },
      }).then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to delete reminder ${reminderId}: ${response.statusText}`);
        }
        console.log(`Successfully deleted reminder ${reminderId}`);
      });
    });

    await Promise.all(deletePromises);
    console.log('All valid reminders deleted successfully.');
  } catch (error) {
    console.error('Error deleting all reminders:', error);
    throw new Error('Failed to delete all reminders');
  }

 
};