import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Check, 
  XCircle 
} from 'lucide-react';
import type { RequestStatus } from '../types';

interface StatusBadgeProps {
  status: RequestStatus | 'Tersedia' | 'Tidak tersedia';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'Diajukan':
      return (
        <span className={`status-badge diajukan ${className}`} role="status">
          <Clock size={12} strokeWidth={2.5} />
          <span>Diajukan</span>
        </span>
      );
    case 'Ditugaskan':
      return (
        <span className={`status-badge ditugaskan ${className}`} role="status">
          <CheckCircle2 size={12} strokeWidth={2.5} />
          <span>Ditugaskan</span>
        </span>
      );
    case 'Bentrok':
      return (
        <span className={`status-badge bentrok ${className}`} role="status">
          <AlertCircle size={12} strokeWidth={2.5} />
          <span>Bentrok</span>
        </span>
      );
    case 'Diproses':
      return (
        <span className={`status-badge diproses ${className}`} role="status">
          <Loader2 size={12} className="spinner" strokeWidth={2.5} />
          <span>Diproses</span>
        </span>
      );
    case 'Selesai':
      return (
        <span className={`status-badge selesai ${className}`} role="status">
          <Check size={12} strokeWidth={2.5} />
          <span>Selesai</span>
        </span>
      );
    case 'Draf':
      return (
        <span className={`status-badge draf ${className}`} role="status">
          <FileText size={12} strokeWidth={2.5} />
          <span>Draf</span>
        </span>
      );
    case 'Tersedia':
      return (
        <span className={`status-badge available ${className}`} role="status">
          <Check size={12} strokeWidth={2.5} />
          <span>Tersedia</span>
        </span>
      );
    case 'Tidak tersedia':
      return (
        <span className={`status-badge unavailable ${className}`} role="status">
          <XCircle size={12} strokeWidth={2.5} />
          <span>Tidak tersedia</span>
        </span>
      );
    default:
      return null;
  }
};
