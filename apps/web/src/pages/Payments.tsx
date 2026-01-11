
import { useState, useEffect } from 'react'
import { Payment, PaymentSchema } from '@pulsepay/shared';
import { z } from 'zod';
import { LiveFeed } from '../components/LiveFeed';
import { SimulatorControls } from '../components/SimulatorControls';

const PaymentsListSchema = z.array(PaymentSchema);

export function Payments() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [merchantFilter, setMerchantFilter] = useState<string>("All");

    const fetchPayments = async () => {
        const params = new URLSearchParams();
        if (statusFilter !== 'All') params.append('status', statusFilter);
        if (merchantFilter !== 'All') params.append('merchantId', merchantFilter);

        try {
            const res = await fetch(`http://localhost:4000/payments?${params}`);
            const json = await res.json();
            const parsed = PaymentsListSchema.safeParse(json);
            if (parsed.success) {
                setPayments(parsed.data);
            } else {
                console.error("Payment validation failed", parsed.error);
            }
        } catch (e) {
            console.error("Failed to fetch payments", e);
        }
    }

    // Initial load and filter changes
    useEffect(() => {
        fetchPayments();
    }, [statusFilter, merchantFilter]);

    // Poll for updates (simple way to keep table fresh-ish while live feed shows instant events)
    // In a real app, ws events would update this state too.
    useEffect(() => {
        const interval = setInterval(fetchPayments, 3000);
        return () => clearInterval(interval);
    }, [statusFilter, merchantFilter]);


    const uniqueMerchants = Array.from(new Set(payments.map(p => p.merchantId))).sort();

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <main>
                <div style={{ marginBottom: '2rem' }}>
                    <SimulatorControls />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Status</label>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            <option value="All">All</option>
                            <option value="Created">Created</option>
                            <option value="Authorized">Authorized</option>
                            <option value="Captured">Captured</option>
                            <option value="Failed">Failed</option>
                            <option value="Refunded">Refunded</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Merchant</label>
                        <select
                            value={merchantFilter}
                            onChange={e => setMerchantFilter(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', minWidth: '150px' }}
                        >
                            <option value="All">All</option>
                            {uniqueMerchants.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => fetchPayments()}
                        style={{
                            marginLeft: 'auto',
                            padding: '0.5rem 1rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            background: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Refresh List
                    </button>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead style={{ backgroundColor: '#f9f9f9' }}>
                            <tr>
                                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>ID</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Date</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Merchant</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #eee' }}>Amount</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(payment => (
                                <tr key={payment.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{payment.id.split('-')[0]}...</td>
                                    <td style={{ padding: '0.75rem' }}>{new Date(payment.createdAt).toLocaleDateString()}</td>
                                    <td style={{ padding: '0.75rem' }}>{payment.merchantId}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                        {(payment.amountCents / 100).toLocaleString('en-US', { style: 'currency', currency: payment.currency })}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            backgroundColor:
                                                payment.status === 'Captured' ? '#def7ec' :
                                                    payment.status === 'Failed' ? '#fde8e8' :
                                                        '#f3f4f6',
                                            color:
                                                payment.status === 'Captured' ? '#03543f' :
                                                    payment.status === 'Failed' ? '#9b1c1c' :
                                                        '#1f2937'
                                        }}>
                                            {payment.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            <aside>
                <LiveFeed />
            </aside>
        </div>
    )
}
