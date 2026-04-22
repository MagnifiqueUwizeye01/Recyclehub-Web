import { getStatusColor } from '../../utils/statusHelpers';

export default function StatusChip({ status, className = '' }) {
  const colors = getStatusColor(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border font-body ${colors} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {status}
    </span>
  );
}
