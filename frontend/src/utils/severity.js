export function getSeverityStyle(severity) {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      return {
        bg: 'var(--status-critical-bg)',
        text: 'var(--status-critical-text)',
        border: 'var(--status-critical-border)'
      };
    case 'HIGH':
      return {
        bg: 'var(--status-high-bg)',
        text: 'var(--status-high-text)',
        border: 'var(--status-high-border)'
      };
    case 'MEDIUM':
      return {
        bg: 'var(--status-medium-bg)',
        text: 'var(--status-medium-text)',
        border: 'var(--status-medium-border)'
      };
    case 'LOW':
    default:
      return {
        bg: 'var(--status-low-bg)',
        text: 'var(--status-low-text)',
        border: 'var(--status-low-border)'
      };
  }
}

export function formatTimestamp(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}
