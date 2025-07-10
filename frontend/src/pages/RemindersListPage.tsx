import { useState, useEffect } from 'react';
import { getReminders } from '../api/client';
import type { Reminder } from '../types/app';
import ReminderCard from '../components/Remindercard';
import { Link } from 'react-router-dom';
import { ChevronLeft, Calendar } from 'lucide-react';

const RemindersListPage = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLongTerm, setShowLongTerm] = useState(false);

  const fetchReminders = async () => {
    try {
      const remindersData = await getReminders();
      setReminders(remindersData);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

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

  return (
    <div className="bg-wa-chat-bg h-full">
      <header className="bg-wa-green-light p-4 text-white flex items-center">
        <Link to="/"><ChevronLeft className="mr-4 cursor-pointer" /></Link>
        <h1 className="text-xl font-semibold">Scheduled Reminders</h1>
        <button
          onClick={() => setShowLongTerm(!showLongTerm)}
          className="ml-auto p-2 rounded-full hover:bg-wa-green-dark focus:outline-none"
          aria-label={showLongTerm ? 'Show short-term reminders' : 'Show long-term reminders'}
        >
          <Calendar size={20} className={showLongTerm ? 'text-yellow-300' : 'text-white'} />
        </button>
      </header>
      <main className="p-4 space-y-3">
        {loading && <p>Loading...</p>}
        {!loading && displayedReminders.length === 0 && (
          <p className="text-center text-slate-500 mt-8">
            {showLongTerm ? 'No long-term reminders scheduled.' : 'No short-term reminders scheduled.'}
          </p>
        )}
        {displayedReminders.map((reminder) => (
          <ReminderCard key={reminder._id} reminder={reminder} />
        ))}
      </main>
    </div>
  );
};

export default RemindersListPage;