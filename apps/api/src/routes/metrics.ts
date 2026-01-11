
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { MetricsService } from '../services/metrics.js';

const MetricsQuerySchema = z.object({
    from: z.string().optional(),
    to: z.string().optional()
});

const TimeseriesQuerySchema = MetricsQuerySchema.extend({
    bucket: z.enum(['hour', 'day']).default('day')
});

export async function metricsRoutes(server: FastifyInstance) {
    server.get('/metrics/summary', async (request, reply) => {
        const query = MetricsQuerySchema.parse(request.query);
        const to = query.to ? new Date(query.to) : new Date();
        const from = query.from ? new Date(query.from) : new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h default

        return MetricsService.getSummary(from, to);
    });

    server.get('/metrics/timeseries', async (request, reply) => {
        const query = TimeseriesQuerySchema.parse(request.query);
        const to = query.to ? new Date(query.to) : new Date();
        const from = query.from ? new Date(query.from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7d default for charts

        return MetricsService.getTimeseries(from, to, query.bucket);
    });

    server.get('/metrics/failure-reasons', async (request, reply) => {
        const query = MetricsQuerySchema.parse(request.query);
        const to = query.to ? new Date(query.to) : new Date();
        const from = query.from ? new Date(query.from) : new Date(Date.now() - 24 * 60 * 60 * 1000);

        return MetricsService.getFailureReasons(from, to);
    });
}
