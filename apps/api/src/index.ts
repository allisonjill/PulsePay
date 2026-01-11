import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { HealthResponse } from '@pulsepay/shared';
import { prisma } from './db.js';
import { z } from 'zod';

import websocket from '@fastify/websocket';
import { setupWebSocket } from './services/websocket.js';
import { simulatorRoutes } from './routes/simulate.js';
import { metricsRoutes } from './routes/metrics.js';

const server = Fastify({
    logger: true
});

server.register(cors, {
    origin: "http://localhost:5173"
});

server.register(websocket);
server.register(sensible);

// Setup WebSocket routes
setupWebSocket(server);

// Setup Simulator routes
server.register(simulatorRoutes);
server.register(metricsRoutes);


server.get<{ Reply: HealthResponse }>('/health', async (request, reply) => {
    return { status: 'ok', service: 'api' };
});

const GetPaymentsSchema = z.object({
    status: z.string().optional(),
    merchantId: z.string().optional(),
    minAmount: z.string().regex(/^\d+$/).transform(Number).optional(),
    maxAmount: z.string().regex(/^\d+$/).transform(Number).optional(),
});

server.get('/payments', async (request, reply) => {
    const query = GetPaymentsSchema.parse(request.query);

    const where: any = {};
    if (query.status && query.status !== 'All') where.status = query.status;
    if (query.merchantId && query.merchantId !== 'All') where.merchantId = query.merchantId;
    if (query.minAmount !== undefined) where.amountCents = { ...where.amountCents, gte: query.minAmount };
    if (query.maxAmount !== undefined) where.amountCents = { ...where.amountCents, lte: query.maxAmount };

    const payments = await prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' }
    });
    return payments;
});

server.get<{ Params: { id: string } }>('/payments/:id', async (request, reply) => {
    const { id } = request.params;
    const payment = await prisma.payment.findUnique({
        where: { id }
    });

    if (!payment) {
        throw server.httpErrors.notFound();
    }
    return payment;
});

const start = async () => {
    try {
        await server.listen({ port: 4000, host: '0.0.0.0' });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};


export { server };


import path from 'path';
import { fileURLToPath } from 'url';

const nodePath = path.resolve(process.argv[1]);
const modulePath = path.resolve(fileURLToPath(import.meta.url));

if (nodePath === modulePath) {
    start();
}
