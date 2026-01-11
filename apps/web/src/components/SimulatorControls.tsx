import { useState, useEffect } from 'react';

export function SimulatorControls() {
    const [status, setStatus] = useState<{ running: boolean, intervalMs: number } | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchStatus = async () => {
        try {
            const res = await fetch('http://localhost:4000/simulate/status');
            const data = await res.json();
            setStatus(data);
        } catch (e) {
            console.error("Failed to fetch simulator status", e);
        }
    };

    useEffect(() => {
        fetchStatus();
        const poll = setInterval(fetchStatus, 5000);
        return () => clearInterval(poll);
    }, []);

    const toggleSimulator = async () => {
        if (!status) return;
        setLoading(true);
        try {
            const endpoint = status.running ? '/simulate/stop' : '/simulate/start';
            const method = 'POST';
            await fetch(`http://localhost:4000${endpoint}`, { method });
            await fetchStatus();
        } finally {
            setLoading(false);
        }
    };

    if (!status) return <div>Loading controls...</div>;

    return (
        <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1rem', backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ margin: 0 }}>Simulator</h3>
                <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    backgroundColor: status.running ? '#0e9f6e' : '#9ca3af'
                }} />
                <span style={{ fontSize: '0.9rem', color: '#666' }}>
                    {status.running ? `Running (${status.intervalMs}ms)` : 'Stopped'}
                </span>

                <button
                    onClick={toggleSimulator}
                    disabled={loading}
                    style={{
                        marginLeft: 'auto',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        backgroundColor: status.running ? '#f05252' : '#3f83f8',
                        color: 'white',
                        fontWeight: 'bold'
                    }}
                >
                    {status.running ? 'Stop' : 'Start'}
                </button>
            </div>
        </div>
    );
}
