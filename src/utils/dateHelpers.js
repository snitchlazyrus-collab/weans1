export const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString();
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString();
};

export const getToday = () => {
  return new Date().toDateString();
};

export const getDayName = (date) => {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
};

export const calculateDuration = (start, end) => {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  return (endDate - startDate) / 60000; // Returns duration in minutes
};

export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
};

export const isToday = (dateString) => {
  return dateString === getToday();
};

export const getOrdinalSuffix = (num) => {
  if (num === 1) return 'st';
  if (num === 2) return 'nd';
  if (num === 3) return 'rd';
  return 'th';
};
