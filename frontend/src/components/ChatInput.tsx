import { Send } from 'lucide-react';
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
      setIsFocused(false);
      textareaRef.current?.blur();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  // 🔁 Collapse textarea if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="bg-gray-100 px-4 py-2 flex items-center">
      
      <div className="flex-grow mx-4 relative">
        <div className="w-full bg-white rounded-md p-2 shadow-inner">
          <div className="flex justify-between px-4 py-1  text-gray-500 font-bold border-b border-gray-300 ">
            <span>Kamalamma</span>
            <span>72y</span>
            <span>PT123456</span>
          </div>
          <textarea
            ref={textareaRef}
            rows={isFocused ? undefined : 2}
            style={isFocused ? { height: '50vh' } : { height: 'auto' }}
            
          
            
            className="w-full px-4 py-4 border-none focus:outline-none placeholder-gray-400 bg-transparent mt-1 font-san-sarif text-md"
            placeholder="WorkList / Reminders / Patient info"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={handleFocus}
          />
        </div>
      </div>
      <button
        onClick={handleSubmit}
        className={`bg-green-500 rounded-md p-2 text-white ${
          input.trim() ? '' : 'opacity-50 cursor-not-allowed'
        }`}
        disabled={!input.trim()}
      >
        <Send />
      </button>
    </div>
  );
};

export default ChatInput;
