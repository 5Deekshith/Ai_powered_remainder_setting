import React from 'react';
import { format } from 'date-fns';
import type { Message } from '../types/app';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const time = format(new Date(message.timestamp), 'h:mm a');

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`rounded-lg px-3 py-2 max-w-sm shadow ${
          isUser ? 'bg-wa-msg-user' : 'bg-wa-msg-bot'
        }`}
      >
        <p className="text-sm text-slate-1000 whitespace-pre-wrap font-sans-serif">
          {message.text}
        </p>
        <p className="text-xs text-right text-slate-500 mt-1">{time}</p>
      </div>
    </div>
  );
};

export default MessageBubble;
