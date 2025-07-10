import { useState, useEffect, useCallback } from 'react';
import { getReminders, deleteAllReminders } from '../api/client';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Reminder } from '../types/app';
import ReminderCard from '../components/Remindercard';
import { Link } from 'react-router-dom';
import { ChevronLeft, Calendar, Trash2 } from 'lucide-react';

const RemindersListPage = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLongTerm, setShowLongTerm] = useState(false);

  const fetchReminders = async () => {
    try {
      setError(null);
      const remindersData = await getReminders();
      // Sort reminders by reminder_time (newest first)
      remindersData.sort((a, b) => 
        new Date(b.reminder_time).getTime() - new Date(a.reminder_time).getTime()
      );
      setReminders(remindersData);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      setError('Failed to load reminders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle WebSocket messages to refresh reminders
  const handleWebSocketMessage = useCallback((data: any) => {
    console.log('WebSocket update received:', data);
    // Assuming the WebSocket sends a message indicating a change in reminders
    if (data.type === 'reminderUpdate') {
      fetchReminders(); // Refresh reminders on update
    }
  }, []);

  const { sendMessage, connectionStatus } = useWebSocket(handleWebSocketMessage);

  useEffect(() => {
    fetchReminders();
  }, []);

  // Clear all reminders by calling the API and updating state
  const handleClearReminders = async () => {
    if (!window.confirm('Are you sure you want to delete all reminders?')) return;
    try {
      setLoading(true);
      setError(null);
      await deleteAllReminders(); // Call API to delete all reminders
      setReminders([]); // Clear reminders in state
      // Notify backend via WebSocket
      if (connectionStatus === 'OPEN') {
        sendMessage(JSON.stringify({ type: 'reminderUpdate' }));
      }
    } catch (error) {
      console.error('Error deleting reminders:', error);
      setError('Failed to delete reminders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter reminders: long-term are those with reminder_time >= 1 day from now
  const now = new Date();
  const oneDayInMs = 24 * 60 * 60 * 1000;
  const longTermReminders = reminders.filter((reminder) => {
    const reminderTime = new Date(reminder.reminder_time);
    return (reminderTime.getTime() - now.getTime()) >= oneDayInMs;
  });
  const shortTermReminders = reminders.filter((reminder) => {
    const reminderTime = new Date(reminder.reminder_time);
    return (reminderTime.getTime() - now.getTime()) < oneDayInMs;
  });

  // Show short-term reminders by default, long-term when toggled
  const displayedReminders = showLongTerm ? longTermReminders : shortTermReminders;

  // Map connectionStatus to user-friendly text and color
  // const statusText = {
  //   CONNECTING: 'Connecting...',
  //   OPEN: 'Connected',
  //   CLOSED: 'Disconnected',
  //   ERROR: 'Error'
  // };
  // const statusColor = {
  //   CONNECTING: 'text-yellow-500',
  //   OPEN: 'text-green-500',
  //   CLOSED: 'text-red-500',
  //   ERROR: 'text-red-500'
  // };

  return (
    <div className="bg-wa-chat-bg h-full flex flex-col">
      <header className="bg-wa-green-light p-4 text-white flex items-center">
        <Link to="/">
          <ChevronLeft className="mr-4 cursor-pointer w-6 h-6" />
        </Link>
        <h1 className="text-lg font-semibold">Scheduled Reminders</h1>
        <button
          onClick={() => setShowLongTerm(!showLongTerm)}
          className="ml-auto p-2 rounded-full hover:bg-wa-green-dark focus:outline-none"
          aria-label={showLongTerm ? 'Show short-term reminders' : 'Show long-term reminders'}
        >
          <Calendar size={18} className={showLongTerm ? 'text-yellow-300' : 'text-white'} />
        </button>
        
      </header>
      <main className="relative flex-grow p-3 space-y-3 overflow-y-auto">
        {loading && (
          <p key="loading" className="text-center text-slate-500">
            Loading...
          </p>
        )}
        {error && (
          <p key="error" className="text-center text-red-500">
            {error}
          </p>
        )}
        {!loading && !error && displayedReminders.length === 0 && (
          <p key="no-reminders" className="text-center text-slate-500 mt-8">
            {showLongTerm ? 'No long-term reminders scheduled.' : 'No short-term reminders scheduled.'}
          </p>
        )}
        {displayedReminders.map((reminder) => (
          <ReminderCard key={reminder.id || reminder._id || reminder.reminderId} reminder={reminder} />
        ))}
        {displayedReminders.length > 0 && (
          <button
            onClick={handleClearReminders}
            className="fixed bottom-3 left-3 bg-wa-green-light text-white p-2.5 rounded-full flex items-center justify-center gap-1.5 hover:bg-wa-green-dark transition-transform transform hover:scale-105 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-md sm:p-3 sm:bottom-4 sm:left-4"
            aria-label="Clear all reminders"
            disabled={loading}
          >
            <Trash2 size={20} className="sm:size-18" />
          </button>
        )}
      </main>
    </div>
  );
};

export default RemindersListPage;