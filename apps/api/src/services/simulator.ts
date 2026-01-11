import { PrismaClient } from '../generated/client/index.js';
import { broadcast } from './websocket.js';
import { PaymentEvent } from '@pulsepay/shared';

const prisma = new PrismaClient();
let intervalId: NodeJS.Timeout | null = null;
let currentIntervalMs = 1500;

const STATUS_FLOW = {
    CREATED: 'Created',
    AUTHORIZED: 'Authorized',
    CAPTURED: 'Captured',
    FAILED: 'Failed',
    REFUNDED: 'Refunded'
};

async function createEvent(paymentId: string, type: 'PAYMENT_CREATED' | 'PAYMENT_AUTHORIZED' | 'PAYMENT_CAPTURED' | 'PAYMENT_FAILED' | 'PAYMENT_REFUNDED', metadata?: any) {
    const event = await prisma.paymentEvent.create({
        data: {
            paymentId,
            type,
            metadata: metadata ? JSON.stringify(metadata) : undefined
        }
    });

    // Update payment status
    let status = STATUS_FLOW.CREATED;
    if (type === 'PAYMENT_AUTHORIZED') status = STATUS_FLOW.AUTHORIZED;
    if (type === 'PAYMENT_CAPTURED') status = STATUS_FLOW.CAPTURED;
    if (type === 'PAYMENT_FAILED') status = STATUS_FLOW.FAILED;
    if (type === 'PAYMENT_REFUNDED') status = STATUS_FLOW.REFUNDED;

    await prisma.payment.update({
        where: { id: paymentId },
        data: { status }
    });

    // Broadcast
    const payload: PaymentEvent = {
        id: event.id,
        paymentId: event.paymentId,
        type: event.type as any,
        metadata: metadata,
        createdAt: event.createdAt.toISOString()
    };

    broadcast({ kind: 'payment_event', event: payload });
}

async function simulateFlow() {
    const merchantIds = ["merch_01", "merch_02", "merch_03", "merch_04", "merch_05"];
    const merchantId = merchantIds[Math.floor(Math.random() * merchantIds.length)];
    const amountCents = Math.floor(Math.random() * 10000) + 100;

    // 1. Create Payment
    const payment = await prisma.payment.create({
        data: {
            amountCents,
            currency: 'USD',
            merchantId,
            status: STATUS_FLOW.CREATED
        }
    });

    await createEvent(payment.id, 'PAYMENT_CREATED');

    // Random delay for next step (simulating card processing time)
    setTimeout(async () => {
        const rand = Math.random();

        if (rand > 0.1) {
            // 90% Authorized
            await createEvent(payment.id, 'PAYMENT_AUTHORIZED');

            setTimeout(async () => {
                const rand2 = Math.random();
                if (rand2 > 0.15) {
                    // 85% of Auth -> Captured
                    await createEvent(payment.id, 'PAYMENT_CAPTURED');

                    // 10% Refunded
                    if (Math.random() < 0.1) {
                        setTimeout(async () => {
                            await createEvent(payment.id, 'PAYMENT_REFUNDED');
                        }, 1000);
                    }

                } else {
                    // 15% of Auth -> Failed
                    const reasons = ["DoNotHonor", "InsufficientFunds", "FraudSuspected"];
                    const reason = reasons[Math.floor(Math.random() * reasons.length)];
                    await createEvent(payment.id, 'PAYMENT_FAILED', { reason });
                }
            }, 500 + Math.random() * 1000);

        } else {
            // 10% Immediate Failure
            await createEvent(payment.id, 'PAYMENT_FAILED', { reason: "InvalidMerchant" });
        }

    }, 300 + Math.random() * 1000);
}

export const Simulator = {
    start: (intervalMs: number = 1500) => {
        if (intervalId) return;
        currentIntervalMs = intervalMs;
        console.log(`Simulator started with interval ${intervalMs}ms`);
        intervalId = setInterval(simulateFlow, intervalMs);
    },
    stop: () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
            console.log('Simulator stopped');
        }
    },
    status: () => ({
        running: !!intervalId,
        intervalMs: currentIntervalMs
    })
};
