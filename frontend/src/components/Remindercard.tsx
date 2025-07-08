import React from 'react';
import { format } from 'date-fns';
import type { Reminder } from '../types/app';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { toggleReminderCompletion } from '../api/client';

interface ReminderCardProps {
  reminder: Reminder;
  onUpdate: () => void; // Callback to refresh reminders list
}

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onUpdate }) => {
  const formattedDateTime = format(
    new Date(reminder.reminder_time),
    "MMMM d, yyyy 'at' h:mm a"
  );

  const handleToggleComplete = async () => {
    try {
      await toggleReminderCompletion(reminder._id);
      onUpdate(); // Refresh the reminders list
    } catch (error) {
      console.error('Error toggling reminder completion:', error);
    }
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm w-full transition-shadow hover:shadow-md ${reminder.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start space-x-3">
        <div className="bg-wa-green-lighter p-2 rounded-full mt-1">
          <Calendar size={20} className="text-white" />
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-center">
            <p className={`font-bold text-slate-800 text-lg ${reminder.completed ? 'line-through' : ''}`}>
              {reminder.task}
            </p>
            <button
              onClick={handleToggleComplete}
              className="p-1 text-wa-green-light hover:text-wa-green-dark focus:outline-none"
              aria-label={reminder.completed ? 'Mark as incomplete' : 'Mark as complete'}
            >
              <CheckCircle size={20} className={reminder.completed ? 'text-wa-green-dark' : 'text-gray-400'} />
            </button>
          </div>
          <div className="flex items-center space-x-2 text-sm text-wa-text-light mt-2">
            <Clock size={14} />
            <span>{formattedDateTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderCard;