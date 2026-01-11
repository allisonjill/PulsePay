
import { useEffect, useState } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import { MetricsSummary, MetricsTimeSeriesBucket, MetricsFailureReason } from '@pulsepay/shared';

export function Dashboard() {
    const [summary, setSummary] = useState<MetricsSummary | null>(null);
    const [timeseries, setTimeseries] = useState<MetricsTimeSeriesBucket[]>([]);
    const [failureReasons, setFailureReasons] = useState<MetricsFailureReason[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sumRes, timeRes, failRes] = await Promise.all([
                    fetch('http://localhost:4000/metrics/summary'),
                    fetch('http://localhost:4000/metrics/timeseries?bucket=day'),
                    fetch('http://localhost:4000/metrics/failure-reasons')
                ]);

                setSummary(await sumRes.json());
                setTimeseries(await timeRes.json());
                setFailureReasons(await failRes.json());
            } catch (err) {
                console.error("Failed to fetch metrics", err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll for updates
        return () => clearInterval(interval);
    }, []);

    if (!summary) return <div>Loading metrics...</div>;

    const cards = [
        { label: 'Total Payments', value: summary.totalPayments, color: '#4299e1' },
        { label: 'Volume', value: (summary.totalAmountCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }), color: '#48bb78' },
        { label: 'Success Rate', value: `${(summary.successRate * 100).toFixed(1)}%`, color: summary.successRate > 0.9 ? '#48bb78' : '#ed8936' },
        { label: 'Failed', value: summary.failedCount, color: '#f56565' },
    ];

    return (
        <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Overview (Last 24h)</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {cards.map((card) => (
                    <div key={card.label} style={{ padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                        <div style={{ color: '#718096', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{card.label}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: card.color }}>{card.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Payment Volume (Last 7 Days)</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timeseries}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="bucketStart"
                                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { weekday: 'short' })}
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    style={{ fontSize: '12px' }}
                                    tickFormatter={(val) => `$${val / 100}`}
                                />
                                <Tooltip
                                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                    formatter={(value: any) => [`$${(value / 100).toFixed(2)}`, 'Volume']}
                                />
                                <Area type="monotone" dataKey="amountCapturedCents" stroke="#3182ce" fill="#ebf8ff" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Payment Status (Last 7 Days)</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={timeseries}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis hide dataKey="bucketStart" />
                                <YAxis style={{ fontSize: '12px' }} />
                                <Tooltip labelFormatter={(label) => new Date(label).toLocaleDateString()} />
                                <Legend />
                                <Bar dataKey="captured" stackId="a" fill="#48bb78" name="Captured" />
                                <Bar dataKey="failed" stackId="a" fill="#f56565" name="Failed" />
                                <Bar dataKey="refunded" stackId="a" fill="#ed8936" name="Refunded" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Top Failure Reasons</h3>
                <div style={{ height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={failureReasons} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" style={{ fontSize: '12px' }} />
                            <YAxis type="category" dataKey="reason" width={150} style={{ fontSize: '12px' }} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#f56565" barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
