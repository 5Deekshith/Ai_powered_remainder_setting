import { AlertTriangle } from 'lucide-react';
import React from 'react';

interface ToastProps {
  task: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ task, onClose }) => {
  return (
    <div className="fixed top-5 right-5 bg-wa-green-lighter text-white p-4 rounded-lg shadow-xl z-50 flex items-center space-x-3 animate-fade-in-down">
      <AlertTriangle size={24} />
      <div>
        <p className="font-bold">Reminder!</p>
        <p>{task}</p>
      </div>
      <button
        onClick={onClose}
        className="ml-3 text-white bg-transparent hover:text-wa-green-dark focus:outline-none"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;