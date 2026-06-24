import { useEffect, useRef, useState } from 'react';

type Step = 'idle' | 'embedding' | 'searching' | 'tagging' | 'saving' | 'done';

interface WSState {
  step: Step;
  detail: string;
  isConnected: boolean;
}

export function useWebSocket(clientId: string): WSState {
  const [state, setState] = useState<WSState>({ step: 'idle', detail: '', isConnected: false });
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);

  useEffect(() => {
    if (!clientId) return;

    const baseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000')
      .replace(/^http/, 'ws');

    const connect = () => {
      const ws = new WebSocket(`${baseUrl}/ws/progress/${clientId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        retriesRef.current = 0;
        setState((s) => ({ ...s, isConnected: true }));
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.step) {
            setState({ step: data.step as Step, detail: data.detail ?? '', isConnected: true });
          }
        } catch {/* ignore */ }
      };

      ws.onclose = () => {
        setState((s) => ({ ...s, isConnected: false }));
        if (retriesRef.current < 3) {
          retriesRef.current++;
          setTimeout(connect, 1000);
        }
      };

      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [clientId]);

  return state;
}
