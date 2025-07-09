import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import type { Reminder } from '../types/app';
import {
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  Pencil,
  Trash,
  Save,
} from 'lucide-react';
import {
  toggleReminderCompletion,
   deleteReminder, 
  updateReminder,
} from '../api/client';

interface ReminderCardProps {
  reminder: Reminder;
  onUpdate: () => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onUpdate,
}) => {
  const [localCompleted, setLocalCompleted] = useState(reminder.completed);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(reminder.task);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    setLocalCompleted(reminder.completed);
  }, [reminder.completed]);

  // Delete after 5 minutes if completed
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (localCompleted) {
      timer = setTimeout(async () => {
        try {
          // await deleteReminder(reminder._id);
          // onUpdate();
          console.error('deleteReminder is not exported from ../api/client');
        } catch (err) {
          console.error('Error deleting completed reminder:', err);
        }
      }, 5 * 60 * 1000);
    }
    return () => clearTimeout(timer);
  }, [localCompleted, reminder._id, onUpdate]);

  const handleToggle = async () => {
    const newStatus = !localCompleted;
    setLocalCompleted(newStatus); // UI feedback
    setIsToggling(true);
    try {
      await toggleReminderCompletion(reminder._id);
      onUpdate();
    } catch (err) {
      console.error('Toggle failed:', err);
      setLocalCompleted(!newStatus); // Revert on failure
    } finally {
      setIsToggling(false);
    }
  };

  const handleEditSave = async () => {
    try {
      await updateReminder(reminder._id, { task: editedTask });
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.error('Edit failed:', err);
    }
  };

  const formattedTime = format(
    new Date(reminder.reminder_time),
    "MMMM d, yyyy 'at' h:mm a"
  );

  return (
    <div
      className={`bg-white p-4 rounded-lg shadow-sm w-full transition-shadow hover:shadow-md ${
        localCompleted ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="bg-wa-green-lighter p-2 rounded-full mt-1">
          <Calendar size={20} className="text-white" />
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            {isEditing ? (
              <input
                value={editedTask}
                onChange={(e) => setEditedTask(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-full"
              />
            ) : (
              <p
                className={`font-bold text-slate-800 text-lg ${
                  localCompleted ? 'line-through' : ''
                }`}
              >
                {reminder.task}
              </p>
            )}

            <div className="flex items-center space-x-2 ml-2">
              <button
                onClick={handleToggle}
                disabled={isToggling}
                title="Toggle Complete"
              >
                {localCompleted ? (
                  <CheckCircle size={20} className="text-green-600" />
                ) : (
                  <Circle size={20} className="text-gray-400" />
                )}
              </button>

              {!localCompleted && (
                <>
                  {isEditing ? (
                    <button
                      onClick={handleEditSave}
                      className="text-blue-500"
                      title="Save"
                    >
                      <Save size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-gray-500"
                      title="Edit"
                    >
                      <Pencil size={18} />
                    </button>
                  )}
                </>
              )}

              <button
                onClick={async () => {
                  await deleteReminder(reminder._id);
                  onUpdate();
                }}
                className="text-red-500"
                title="Delete"
              >
                <Trash size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-wa-text-light mt-2">
            <Clock size={14} />
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderCard;
