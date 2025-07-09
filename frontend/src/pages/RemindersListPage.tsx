import { useState, useEffect } from 'react';
import { getReminders } from '../api/client';
import type { Reminder } from '../types/app';
import ReminderCard from '../components/Remindercard';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const RemindersListPage = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="bg-wa-chat-bg h-full">
      <header className="bg-wa-green-light p-4 text-white flex items-center">
        <Link to="/"><ChevronLeft className="mr-4 cursor-pointer" /></Link>
        <h1 className="text-xl font-semibold">Scheduled Reminders</h1>
      </header>
      <main className="p-4 space-y-3">
        {loading && <p>Loading...</p>}
        {!loading && reminders.length === 0 && (
          <p className="text-center text-slate-500 mt-8">No reminders scheduled yet.</p>
        )}
        {reminders.map((reminder) => (
          <ReminderCard key={reminder._id} reminder={reminder} onUpdate={fetchReminders} />
        ))}
      </main>
    </div>
  );
};

export default RemindersListPage;