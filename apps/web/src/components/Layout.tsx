
import { Link, Outlet, useLocation } from 'react-router-dom';

export function Layout() {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const navStyle = (path: string) => ({
        padding: '0.5rem 1rem',
        textDecoration: 'none',
        color: isActive(path) ? '#2c7a7b' : '#4a5568',
        borderBottom: isActive(path) ? '2px solid #2c7a7b' : '2px solid transparent',
        fontWeight: isActive(path) ? 'bold' : 'normal'
    });

    return (
        <div className="container" style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1a202c' }}>PulsePay</h1>
                    <nav style={{ display: 'flex', gap: '1rem' }}>
                        <Link to="/dashboard" style={navStyle('/dashboard')}>Dashboard</Link>
                        <Link to="/payments" style={navStyle('/payments')}>Payments</Link>
                    </nav>
                </div>
            </header>
            <main>
                <Outlet />
            </main>
        </div>
    );
}
