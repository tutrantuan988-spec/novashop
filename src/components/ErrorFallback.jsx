/**
 * ErrorFallback — Presentational error UI component
 * Hiển thị lỗi đẹp mắt + nút retry/home
 * Dùng trong ErrorBoundary, Suspense, hoặc bất kỳ chỗ nào cần fallback UI
 */
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { memo } from 'react';

function ErrorFallback({ error, onReset, fallbackMessage, showContact }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <AlertTriangle size={56} color="#dc2626" aria-hidden />
        <h1 style={styles.title}>Đã xảy ra lỗi</h1>
        <p style={styles.message}>
          {fallbackMessage || 'Có lỗi xảy ra. Vui lòng thử lại.'}
        </p>

        {import.meta.env.DEV && error && (
          <details style={styles.details}>
            <summary style={styles.summary}>Chi tiết lỗi</summary>
            <pre style={styles.pre}>
              {error?.toString()}
              {error?.stack && '\n\nStack trace:\n' + error.stack}
            </pre>
          </details>
        )}

        <div style={styles.buttons}>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              style={styles.primaryButton}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              <RefreshCw size={18} style={{ marginRight: 8 }} />
              Thử lại
            </button>
          )}
          <button
            type="button"
            onClick={() => window.location.href = '/'}
            style={styles.secondaryButton}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
          >
            <Home size={18} style={{ marginRight: 8 }} />
            Về trang chủ
          </button>
        </div>

        {showContact && (
          <p style={styles.contact}>
            Nếu lỗi vẫn tiếp diễn, vui lòng liên hệ{' '}
            <a href="mailto:tutrantuan988@gmail.com" style={styles.link}>
              tutrantuan988@gmail.com
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

export default memo(ErrorFallback);

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    padding: '2rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '3rem 2.5rem',
    maxWidth: 520,
    width: '100%',
    textAlign: 'center'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#111827',
    margin: '1rem 0 0.5rem'
  },
  message: {
    fontSize: '0.95rem',
    color: '#6b7280',
    margin: '0 0 1.5rem',
    lineHeight: 1.5
  },
  details: {
    margin: '0 0 1.5rem',
    textAlign: 'left',
    background: '#f9fafb',
    borderRadius: 8,
    padding: '0.75rem 1rem'
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
    color: '#dc2626',
    marginBottom: '0.5rem'
  },
  pre: {
    fontSize: '0.75rem',
    lineHeight: 1.4,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    color: '#374151',
    maxHeight: 200,
    overflow: 'auto'
  },
  buttons: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.7rem 1.5rem',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.1s'
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.7rem 1.5rem',
    background: '#fff',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.1s'
  },
  contact: {
    marginTop: '2rem',
    fontSize: '0.8rem',
    color: '#9ca3af'
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: 500
  }
};
