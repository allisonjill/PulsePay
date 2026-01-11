import { FastifyInstance } from 'fastify';
import { Simulator } from '../services/simulator.js';
import { z } from 'zod';

const StartSchema = z.object({
    intervalMs: z.number().optional()
});

export async function simulatorRoutes(server: FastifyInstance) {
    server.post('/simulate/start', async (request, reply) => {
        const body = StartSchema.parse(request.body || {});
        Simulator.start(body.intervalMs);
        return { message: 'Simulator started', status: Simulator.status() };
    });

    server.post('/simulate/stop', async (request, reply) => {
        Simulator.stop();
        return { message: 'Simulator stopped', status: Simulator.status() };
    });

    server.get('/simulate/status', async (request, reply) => {
        return Simulator.status();
    });
}
