import { Bell } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const ChatHeader: React.FC = () => (
  <header className="bg-wa-chat-bg p-3 flex justify-between items-center border-b border-slate-700">
    <div className="flex items-center">
      <img
        src="/src/assets/image.png" // Placeholder avatar
        alt="Avatar"
        className="rounded-full w-10 h-10 mr-3"
      />
      <div>
        <h2 className="font-semibold text-slate-600">Patient-01</h2>
        <p className="text-xs text-wa-text-light">online</p>
      </div>
    </div>
    <div className="flex items-center space-x-5 text-wa-text-light">
      <Link to="/reminders" className="p-1 rounded-full hover:bg-slate-200 transition-colors">
        <Bell className="cursor-pointer text-wa-green-light w-5 h-5" />
      </Link>
    </div>
  </header>
);

export default ChatHeader;