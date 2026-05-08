/**
 * Clavis WebSocket Hook
 * Real-time updates for pod status changes
 */
import { useState, useEffect, useCallback, useRef } from 'react';

interface PodUpdate {
  session_id: string;
  status: string;
  event: 'created' | 'ready' | 'destroyed' | 'error';
  timestamp: string;
  data?: any;
}

interface UseClavisWebSocketOptions {
  onUpdate?: (update: PodUpdate) => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
}

export const useClavisWebSocket = (
  userId: string,
  options: UseClavisWebSocketOptions = {}
) => {
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<PodUpdate | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    onUpdate,
    onError,
    reconnectInterval = 5000,
  } = options;

  // Connect to WebSocket
  const connect = useCallback(() => {
    try {
      // Get WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/clavis/${userId}`;

      console.log('Connecting to Clavis WebSocket:', wsUrl);

      // Create WebSocket connection
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Clavis WebSocket connected');
        setConnected(true);

        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const update: PodUpdate = JSON.parse(event.data);
          console.log('Clavis pod update:', update);

          setLastUpdate(update);

          if (onUpdate) {
            onUpdate(update);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('Clavis WebSocket error:', event);
        setConnected(false);

        if (onError) {
          onError(event);
        }
      };

      ws.onclose = () => {
        console.log('Clavis WebSocket disconnected');
        setConnected(false);

        // Attempt to reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, reconnectInterval);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
    }
  }, [userId, onUpdate, onError, reconnectInterval]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setConnected(false);
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connected,
    lastUpdate,
    disconnect,
    reconnect: connect,
  };
};

export default useClavisWebSocket;
