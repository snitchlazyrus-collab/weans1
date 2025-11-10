// Export Attendance to CSV
export const exportAttendanceCSV = (attendance) => {
  let csv = 'Date,Employee ID,Name,Status,Time,Approved\n';
  Object.entries(attendance).forEach(([date, records]) => {
    Object.entries(records).forEach(([empId, record]) => {
      csv += `${date},${empId},${record.name},${record.status},${record.time},${record.approved}\n`;
    });
  });
  downloadFile(csv, 'attendance.csv', 'text/csv');
};

// Export Breaks to CSV
export const exportBreaksCSV = (breaks) => {
  let csv = 'Date,Employee ID,Name,Break Type,Start,End,Duration (min),Approved\n';
  Object.entries(breaks).forEach(([date, records]) => {
    Object.entries(records).forEach(([empId, breakList]) => {
      breakList.forEach(b => {
        const duration = b.end ? ((new Date(b.end) - new Date(b.start)) / 60000).toFixed(2) : 'Ongoing';
        csv += `${date},${empId},${b.name},${b.type},${new Date(b.start).toLocaleTimeString()},${b.end ? new Date(b.end).toLocaleTimeString() : 'N/A'},${duration},${b.approved}\n`;
      });
    });
  });
  downloadFile(csv, 'breaks.csv', 'text/csv');
};

// Helper function to download file
const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
