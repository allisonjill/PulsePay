import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { WsEventMessage } from '@pulsepay/shared';

let connections: Set<WebSocket> = new Set();

export function setupWebSocket(server: FastifyInstance) {
    server.register(async (instance) => {
        instance.get('/ws', { websocket: true }, (connection, req) => {
            console.log('Client connected');
            connections.add(connection.socket);

            connection.socket.on('close', () => {
                console.log('Client disconnected');
                connections.delete(connection.socket);
            });

            connection.socket.on('message', (message: any) => {
                // Handle incoming messages if needed (e.g., ping/pong)
            });

            // Send initial ping to keep connection alive or confirm connection
            connection.socket.send(JSON.stringify({ kind: 'ping' }));
        });
    });
}

export function broadcast(message: WsEventMessage) {
    const payload = JSON.stringify(message);
    connections.forEach(socket => {
        if (socket.readyState === socket.OPEN) {
            socket.send(payload);
        }
    });
}
