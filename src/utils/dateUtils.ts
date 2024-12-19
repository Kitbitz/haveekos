export function formatDateTime(timestamp: number | null | undefined): string {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    return dateFormatter.format(date);
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
}