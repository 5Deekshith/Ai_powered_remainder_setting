import { Paperclip, Mic, Send } from 'lucide-react';
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
    <div className="bg-wa-chat-bg px-4 py-2 flex items-center">
      <Paperclip className="text-wa-text-light cursor-pointer" />
      <form onSubmit={handleSubmit} className="flex-grow mx-4">
        <input
          type="text"
          className="w-full px-4 py-2 rounded-full border-none focus:outline-none"
          placeholder="Type a message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </form>
      {input ? (
         <button onClick={handleSubmit} className="bg-wa-green-light rounded-full p-2 text-white">
            <Send />
         </button>
      ) : (
         <Mic className="text-wa-text-light cursor-pointer" />
      )}
    </div>
  );
};

export default ChatInput;