import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0f',
          color: '#fff',
          fontFamily: 'Inter, sans-serif',
          padding: '2rem',
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '480px',
            padding: '3rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '1.5rem',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 700, 
              marginBottom: '0.75rem',
              background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Terjadi Kesalahan
            </h1>
            <p style={{ 
              color: 'rgba(255,255,255,0.5)', 
              marginBottom: '2rem',
              lineHeight: 1.6,
            }}>
              Aplikasi mengalami error yang tidak terduga. 
              Coba refresh halaman atau kembali ke halaman utama.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                Refresh
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
