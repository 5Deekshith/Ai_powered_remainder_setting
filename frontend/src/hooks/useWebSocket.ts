import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = 'https://ai-powered-remainder-setting.onrender.com/ws';

export const useWebSocket = (onMessage: (data: any) => void) => {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 3000; // 3 seconds

  // Track connection state
  const [connectionStatus, setConnectionStatus] = useState<
    'CONNECTING' | 'OPEN' | 'CLOSED' | 'ERROR'
  >('CONNECTING');

  const connect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('Max WebSocket reconnection attempts reached.');
      setConnectionStatus('ERROR');
      return;
    }

    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;
    setConnectionStatus('CONNECTING');

    socket.onopen = () => {
      console.log('WebSocket connection established.');
      setConnectionStatus('OPEN');
      reconnectAttemptsRef.current = 0; // Reset attempts on success
    };

    socket.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        onMessage(parsedData);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', event.data, error);
      }
    };

    socket.onclose = (event) => {
      console.log(`WebSocket disconnected (code: ${event.code}, reason: ${event.reason}).`);
      setConnectionStatus('CLOSED');
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current); // Exponential backoff
        console.log(`Attempting to reconnect in ${delay / 1000} seconds...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          connect();
        }, delay);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('ERROR');
      socket.close(); // Trigger onclose for reconnection
    };
  }, [onMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current); // Clear any pending reconnects
      }
      if (socketRef.current) {
        socketRef.current.onclose = null; // Prevent reconnect on intentional close
        socketRef.current.close();
      }
      setConnectionStatus('CLOSED');
    };
  }, [connect]);

  const sendMessage = (message: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
    } else {
      console.error('Cannot send message: WebSocket is not open.');
    }
  };

  return { sendMessage, connectionStatus };
};