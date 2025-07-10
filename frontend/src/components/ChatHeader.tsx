import { Bell, User } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const ChatHeader: React.FC = () => (
  <header className="bg-wa-chat-bg p-3 flex justify-between items-center border-b border-slate-700">
    <div className="flex items-center">
      <User className="rounded-full w-6 h-8  mr-3 text-wa-text-light" />
      <div>
        <h2 className="font-semibold text-slate-600">Kamalamma, 72y</h2>
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