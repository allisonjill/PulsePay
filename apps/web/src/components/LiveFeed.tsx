import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { WsEventMessage } from '@pulsepay/shared';

export function LiveFeed() {
    const { isConnected, lastEvent } = useSocket('ws://localhost:4000/ws');
    const [events, setEvents] = useState<WsEventMessage['event'][]>([]);


    useEffect(() => {
        if (lastEvent && lastEvent.kind === 'payment_event') {
            setEvents(prev => [lastEvent.event, ...prev].slice(0, 50)); // Keep last 50
        }
    }, [lastEvent]);

    return (
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0 }}>Live Feed</h3>
                <span style={{
                    fontSize: '0.8rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: isConnected ? '#def7ec' : '#fde8e8',
                    color: isConnected ? '#03543f' : '#9b1c1c'
                }}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {events.length === 0 && (
                    <div style={{ color: '#888', textAlign: 'center', marginTop: '2rem' }}>Waiting for events...</div>
                )}
                {events.map((event) => (
                    <div key={event.id} style={{
                        padding: '0.75rem',
                        borderRadius: '6px',
                        backgroundColor: '#f9fafb',
                        borderLeft: `4px solid ${event.type === 'PAYMENT_FAILED' ? '#f05252' :
                            event.type === 'PAYMENT_CAPTURED' ? '#0e9f6e' :
                                '#3f83f8'
                            }`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#555', marginBottom: '0.2rem' }}>
                            <span>{new Date(event.createdAt).toLocaleTimeString()}</span>
                            <span style={{ fontFamily: 'monospace' }}>{event.paymentId.substring(0, 8)}</span>
                        </div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{event.type}</div>
                        {event.metadata && (
                            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>
                                Details: {JSON.stringify(event.metadata)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
