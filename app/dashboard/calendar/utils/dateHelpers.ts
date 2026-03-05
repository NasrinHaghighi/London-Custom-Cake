// Helper: check if date is today
export function isToday(date: Date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

// Helper: check if date is tomorrow
export function isTomorrow(date: Date) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
}

// Helper: format time as HH:mm
export function formatTime(date: Date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// Time sections for the day
export const TIME_SECTIONS = [
  { label: 'Morning', start: 6, end: 12 },
  { label: 'Noon', start: 12, end: 15 },
  { label: 'Afternoon', start: 15, end: 18 },
  { label: 'Evening', start: 18, end: 23 },
] as const;
