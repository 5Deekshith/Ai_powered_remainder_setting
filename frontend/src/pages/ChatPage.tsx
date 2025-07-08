import React from 'react';
import ChatHeader from '../components/ChatHeader';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import type { Message } from '../types/app';

interface ChatPageProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ messages, onSendMessage }) => {
  return (
    <div className="flex flex-col h-full bg-wa-bg">
      <ChatHeader />
      <ChatWindow messages={messages} />
      <ChatInput onSendMessage={onSendMessage} />
    </div>
  );
};

export default ChatPage;