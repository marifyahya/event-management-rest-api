export const formatCSVDate = (date: Date, timezone?: string) => {
  try {
    return date.toLocaleString('sv-SE', { timeZone: timezone || 'UTC' }).replace('T', ' ');
  } catch (error) {
    // Fallback to UTC if timezone is invalid
    return date.toLocaleString('sv-SE', { timeZone: 'UTC' }).replace('T', ' ');
  }
};
