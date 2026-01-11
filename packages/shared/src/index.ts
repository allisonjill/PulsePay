import { z } from "zod";

export const HealthResponseSchema = z.object({
    status: z.literal("ok"),
    service: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const PaymentSchema = z.object({
    id: z.string(),
    amountCents: z.number(),
    currency: z.string(),
    merchantId: z.string(),
    status: z.string(),
    createdAt: z.string().or(z.date()).transform((val) => new Date(val).toISOString()),
    updatedAt: z.string().or(z.date()).transform((val) => new Date(val).toISOString()).optional(),
});

export type Payment = z.infer<typeof PaymentSchema>;

export const PaymentEventSchema = z.object({
    id: z.string(),
    paymentId: z.string(),
    type: z.enum(['PAYMENT_CREATED', 'PAYMENT_AUTHORIZED', 'PAYMENT_CAPTURED', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED']),
    amountCents: z.number().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    createdAt: z.string().or(z.date()).transform((val) => new Date(val).toISOString()),
});

export type PaymentEvent = z.infer<typeof PaymentEventSchema>;

export const WsEventMessageSchema = z.object({
    kind: z.literal('payment_event'),
    event: PaymentEventSchema
});

export type WsEventMessage = z.infer<typeof WsEventMessageSchema>;


export const MetricsSummarySchema = z.object({
    from: z.string(),
    to: z.string(),
    totalPayments: z.number(),
    totalAmountCents: z.number(),
    capturedCount: z.number(),
    failedCount: z.number(),
    refundedCount: z.number(),
    successRate: z.number(),
    avgAmountCents: z.number(),
});

export type MetricsSummary = z.infer<typeof MetricsSummarySchema>;

export const MetricsTimeSeriesBucketSchema = z.object({
    bucketStart: z.string(),
    paymentsCreated: z.number(),
    captured: z.number(),
    failed: z.number(),
    refunded: z.number(),
    amountCapturedCents: z.number(),
});

export type MetricsTimeSeriesBucket = z.infer<typeof MetricsTimeSeriesBucketSchema>;

export const MetricsFailureReasonSchema = z.object({
    reason: z.string(),
    count: z.number(),
});

export type MetricsFailureReason = z.infer<typeof MetricsFailureReasonSchema>;
