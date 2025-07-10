import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import type { Message, NotificationToast } from './types/app';
import { useWebSocket } from '../../frontend/src/hooks/useWebSocket';
import ChatPage from './pages/ChatPage';
import RemindersListPage from './pages/RemindersListPage';
import Toast from './components/Toast';
//import { Bell } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      text: 'Hello!',
      sender: 'bot',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [notification, setNotification] = useState<NotificationToast | null>(null);

  const handleNewMessage = useCallback((data: any) => {
    if (data.type === 'message') {
      const newMessage: Message = {
        id: new Date().toISOString(),
        text: data.text,
        sender: data.isBot ? 'bot' : 'user',
        timestamp: new Date().toISOString(),
      };
      // If the message is from the user, we add it immediately
      // The backend will echo it, so we need to prevent duplicates
      if(newMessage.sender === 'bot') {
        setMessages((prev) => [...prev, newMessage]);
      }
    } else if (data.type === 'notification') {
      const newNotification = { id: Date.now(), task: data.task };
      setNotification(newNotification);
      setTimeout(() => setNotification(null), 5000);
    }
  }, []);

  const { sendMessage } = useWebSocket(handleNewMessage);

  const handleSendMessage = (text: string) => {
    // Add user's message to state immediately for better UX
    const userMessage: Message = {
      id: new Date().toISOString() + '-user',
      text: text,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    sendMessage(text);
  };
  
  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <div className="w-full max-w-lg h-full md:h-[95vh] md:max-h-[1024px] bg-white shadow-2xl flex flex-col">
        <BrowserRouter>
          {notification && <Toast task={notification.task} onClose={() => setNotification(null)} />}
          <div className="absolute top-2 right-2 md:right-[-50px] z-20">
            <Link to="/reminders" className="bg-white p-3 rounded-full shadow-lg block">
              
            </Link>
          </div>
          <Routes>
            <Route path="/" element={<ChatPage messages={messages} onSendMessage={handleSendMessage} />} />
            <Route path="/reminders" element={<RemindersListPage />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;