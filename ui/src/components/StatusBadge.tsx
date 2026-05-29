import type { AgentStatus } from '../types';
import { STATUS_STYLES } from '../lib/status';

interface Props {
  status: AgentStatus;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: Props) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${s.chipBg} ${s.text} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
