import { AlertTriangle, AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import type { AssignmentConflict } from '../types';

export interface AlertBannerProps {
  type: 'warning' | 'error' | 'success' | 'info';
  title?: string;
  message?: string;
  conflicts?: AssignmentConflict[];
  onActionClick?: () => void;
  actionLabel?: string;
  onDismiss?: () => void;
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type,
  title,
  message,
  conflicts,
  onActionClick,
  actionLabel,
  onDismiss,
  className = '',
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="alert-icon" size={20} />;
      case 'error':
        return <AlertCircle className="alert-icon" size={20} />;
      case 'success':
        return <CheckCircle className="alert-icon" size={20} />;
      case 'info':
        return <Info className="alert-icon" size={20} />;
    }
  };

  return (
    <div
      className={`alert-banner ${type} ${className}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <div style={{ flexShrink: 0, marginTop: 2 }}>{getIcon()}</div>
      <div className="alert-banner-content">
        {title && <div className="alert-banner-title">{title}</div>}
        {message && <div>{message}</div>}
        {conflicts && conflicts.length > 0 && (
          <ul className="conflict-list">
            {conflicts.map((c, idx) => (
              <li key={idx}>
                <strong>{c.crewName}</strong> ({c.role}): {c.reason} pada program{' '}
                <strong>{c.program}</strong> ({c.date}, {c.time}).
              </li>
            ))}
          </ul>
        )}
        {actionLabel && onActionClick && (
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ height: 32, fontSize: 13, padding: '0 12px' }}
              onClick={onActionClick}
            >
              {actionLabel}
            </button>
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="alert-banner-close"
          onClick={onDismiss}
          aria-label="Tutup pemberitahuan"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};
