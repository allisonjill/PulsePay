
import { prisma } from '../db.js';
import { MetricsSummary, MetricsTimeSeriesBucket, MetricsFailureReason } from '@pulsepay/shared';

export class MetricsService {
    static async getSummary(from: Date, to: Date): Promise<MetricsSummary> {
        const payments = await prisma.payment.findMany({
            where: {
                createdAt: {
                    gte: from,
                    lte: to
                }
            }
        });

        const totalPayments = payments.length;
        const totalAmountCents = payments.reduce((sum, p) => sum + p.amountCents, 0);
        const capturedCount = payments.filter(p => p.status === 'Captured').length;
        const failedCount = payments.filter(p => p.status === 'Failed').length;
        const refundedCount = payments.filter(p => p.status === 'Refunded').length;

        const successRate = (capturedCount + failedCount) > 0
            ? capturedCount / (capturedCount + failedCount)
            : 0;

        const avgAmountCents = totalPayments > 0
            ? totalAmountCents / totalPayments
            : 0;

        return {
            from: from.toISOString(),
            to: to.toISOString(),
            totalPayments,
            totalAmountCents,
            capturedCount,
            failedCount,
            refundedCount,
            successRate,
            avgAmountCents
        };
    }

    static async getTimeseries(from: Date, to: Date, bucket: 'hour' | 'day'): Promise<MetricsTimeSeriesBucket[]> {
        const payments = await prisma.payment.findMany({
            where: {
                createdAt: {
                    gte: from,
                    lte: to
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        const buckets: Record<string, MetricsTimeSeriesBucket> = {};

        // Helper to get bucket key
        const getBucketKey = (date: Date) => {
            const d = new Date(date);
            if (bucket === 'hour') {
                d.setMinutes(0, 0, 0);
            } else {
                d.setHours(0, 0, 0, 0);
            }
            return d.toISOString();
        };

        // Initialize buckets (optional, but nice to have continuous lines)
        let current = new Date(from);
        if (bucket === 'hour') current.setMinutes(0, 0, 0); else current.setHours(0, 0, 0, 0);

        while (current <= to) {
            const key = current.toISOString();
            buckets[key] = {
                bucketStart: key,
                paymentsCreated: 0,
                captured: 0,
                failed: 0,
                refunded: 0,
                amountCapturedCents: 0
            };
            if (bucket === 'hour') current.setHours(current.getHours() + 1);
            else current.setDate(current.getDate() + 1);
        }

        payments.forEach(p => {
            const key = getBucketKey(p.createdAt);
            if (!buckets[key]) return; // Should be covered by init loop, but safety

            buckets[key].paymentsCreated++;
            if (p.status === 'Captured') {
                buckets[key].captured++;
                buckets[key].amountCapturedCents += p.amountCents;
            }
            if (p.status === 'Failed') buckets[key].failed++;
            if (p.status === 'Refunded') buckets[key].refunded++;
        });

        return Object.values(buckets).sort((a, b) => a.bucketStart.localeCompare(b.bucketStart));
    }

    static async getFailureReasons(from: Date, to: Date): Promise<MetricsFailureReason[]> {
        // We need payment events for this
        const events = await prisma.paymentEvent.findMany({
            where: {
                type: 'PAYMENT_FAILED',
                createdAt: {
                    gte: from,
                    lte: to
                }
            }
        });

        const reasons: Record<string, number> = {};

        events.forEach(e => {
            let reason = 'Unknown';
            if (e.metadata) {
                try {
                    const meta = JSON.parse(e.metadata);
                    if (meta.reason) reason = meta.reason;
                } catch { }
            }
            reasons[reason] = (reasons[reason] || 0) + 1;
        });

        return Object.entries(reasons).map(([reason, count]) => ({ reason, count }));
    }
}
