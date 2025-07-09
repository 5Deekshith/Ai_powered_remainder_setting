import { Paperclip, Send } from 'lucide-react';
import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="bg-gray-100 px-4 py-2 flex items-center">
      <Paperclip className="text-gray-400 cursor-pointer" />
      <div className="flex-grow mx-4 relative">
        <div className="w-full bg-white rounded-md p-2 shadow-inner">
          <div className="flex justify-between px-4 py-1 text-black font-bold border-b border-gray-300">
            <span>Patient-01</span>
            <span>32y</span>
            <span>PAT123456</span>
          </div>
          <form onSubmit={handleSubmit} className="mt-1">
            <input
              type="text"
              className="w-full px-4 py-2 border-none focus:outline-none placeholder-gray-400 bg-transparent"
              placeholder="WorkList / Reminders / Patient info"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </form>
        </div>
      </div>
      {input ? (
        <button onClick={handleSubmit} className="bg-green-500 rounded-md p-2 text-white">
          <Send />
        </button>
      ) : (
        <button disabled className="bg-green-500 rounded-md p-2 text-white opacity-50 cursor-not-allowed">
          <Send />
        </button>
      )}
    </div>
  );
};

export default ChatInput;