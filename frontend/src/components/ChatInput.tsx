import { Send, List } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
      textareaRef.current?.blur();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };
  
  const handleAddBulletPoint = () => {
    const newText = input.trim() ? `${input}\n• ` : '• ';
    setInput(newText);
    textareaRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (!input.trim()) {
          setIsFocused(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [input]);

  const containerClasses = `bg-gray-100 px-4 py-2 flex ${
    isFocused ? 'items-end' : 'items-center'
  }`;

  return (
    <div ref={wrapperRef} className={containerClasses}>
      <div className="flex-grow mr-4 relative">
        <div className="w-full bg-white rounded-md p-2 shadow-inner flex flex-col">
          <div className="flex justify-between px-4 py-1 text-gray-500 font-bold border-b border-gray-300 ">
            <span>Kamalamma</span>
            <span>72y</span>
            <span>PT123456</span>
          </div>
          <textarea
            ref={textareaRef}
            rows={isFocused ? 10 : 2}
            style={isFocused ? { minHeight: '20vh' } : {}}
            className="w-full px-4 py-4 border-none focus:outline-none placeholder-gray-400 bg-transparent mt-1 font-san-sarif text-md resize-none"
            placeholder="WorkList / Reminders / Patient info"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={handleFocus}
          />
        </div>
      </div>
      
      {/* --- MODIFIED BUTTONS SECTION --- */}
      {/* This div stacks the buttons vertically and centers them */}
      <div className="flex flex-col items-center space-y-2">
        
        {/* 1. Send Button is now first in the code to appear on top */}
        <button
          onClick={handleSubmit}
          // 2. Changed to rounded-full and adjusted padding for a circular look
          className={`bg-green-500 p-3 text-white rounded-full ${
            input.trim() ? 'hover:bg-green-600' : 'opacity-50 cursor-not-allowed'
          }`}
          disabled={!input.trim()}
          aria-label="Send message"
        >
          <Send size={20} />
        </button>

        {/* 3. Bullet Point Button is second, so it appears underneath */}
        <button
          onClick={handleAddBulletPoint}
          // 4. Changed to rounded-full and adjusted padding
          className="bg-gray-200 p-3 text-gray-600 rounded-full hover:bg-gray-300"
          aria-label="Add bullet point"
        >
          <List size={20} />
        </button>

      </div>
    </div>
  );
};

export default ChatInput;