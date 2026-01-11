import { useState, useEffect, useRef, useCallback } from 'react';
import { WsEventMessage, WsEventMessageSchema } from '@pulsepay/shared';


export function useSocket(url: string) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<WsEventMessage | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<any>(null);
    const retryCountRef = useRef(0);

    const connect = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        console.log(`Connecting to ${url}...`);
        const ws = new WebSocket(url);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log("WebSocket Connected");
            setIsConnected(true);
            retryCountRef.current = 0;
        };

        ws.onclose = () => {
            console.log("WebSocket Disconnected");
            setIsConnected(false);
            socketRef.current = null;

            // Reconnect logic
            const timeout = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
            console.log(`Reconnecting in ${timeout}ms...`);
            reconnectTimeoutRef.current = setTimeout(() => {
                retryCountRef.current++;
                connect();
            }, timeout);
        };

        ws.onmessage = (event) => {
            try {
                const json = JSON.parse(event.data);
                if (json.kind === 'ping') return; // Ignore pings

                const parsed = WsEventMessageSchema.safeParse(json);
                if (parsed.success) {
                    setLastEvent(parsed.data);
                } else {
                    console.warn("Invalid WS message:", parsed.error);
                }
            } catch (e) {
                console.error("Error parsing WS message:", e);
            }
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        };
    }, [url]);

    useEffect(() => {
        connect();
        return () => {
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            socketRef.current?.close();
        };
    }, [connect]);

    return { isConnected, lastEvent };
}
