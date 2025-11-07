export const calculateCoverageReport = (clientId, date, clients, clientAssignments, schedules, attendance, breaks) => {
  const client = clients[clientId];
  if (!client) return { error: 'Client not found' };

  const assignments = clientAssignments[clientId] || [];
  const dateStr = new Date(date).toDateString();
  const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
  const businessHours = client.businessHours?.[dayName];

  if (!businessHours || !businessHours.start || !businessHours.end) {
    return { error: 'No business hours set for this day' };
  }

  const report = {
    clientName: client.name,
    date: dateStr,
    dayName,
    businessHours,
    coverage: [],
    totalCoverage: 0
  };

  assignments.forEach(empId => {
    const userSchedule = schedules[empId]?.[dayName];
    const userAttendance = attendance[dateStr]?.[empId];
    const userBreaks = breaks[dateStr]?.[empId] || [];

    let coverageMinutes = 0;
    let adherence = 0;

    if (userSchedule && userSchedule.start && userSchedule.end && userAttendance) {
      const schedStart = new Date(`${dateStr} ${userSchedule.start}`);
      const schedEnd = new Date(`${dateStr} ${userSchedule.end}`);
      const bizStart = new Date(`${dateStr} ${businessHours.start}`);
      const bizEnd = new Date(`${dateStr} ${businessHours.end}`);

      const overlapStart = new Date(Math.max(schedStart, bizStart));
      const overlapEnd = new Date(Math.min(schedEnd, bizEnd));

      if (overlapStart < overlapEnd) {
        coverageMinutes = (overlapEnd - overlapStart) / 60000;

        userBreaks.forEach(brk => {
          if (brk.end) {
            const breakDuration = (new Date(brk.end) - new Date(brk.start)) / 60000;
            coverageMinutes -= breakDuration;
          }
        });
      }

      const totalBizMinutes = (bizEnd - bizStart) / 60000;
      adherence = totalBizMinutes > 0 ? (coverageMinutes / totalBizMinutes) * 100 : 0;
    }

    report.coverage.push({
      employeeId: empId,
      scheduled: userSchedule,
      attended: userAttendance,
      breaks: userBreaks,
      coverageMinutes: Math.max(0, coverageMinutes),
      adherence: Math.max(0, Math.min(100, adherence))
    });
  });

  const totalBizMinutes = (new Date(`${dateStr} ${businessHours.end}`) -
                          new Date(`${dateStr} ${businessHours.start}`)) / 60000;
  const totalCovered = report.coverage.reduce((sum, c) => sum + c.coverageMinutes, 0);
  report.totalCoverage = totalBizMinutes > 0 ? (totalCovered / totalBizMinutes) * 100 : 0;

  return report;
};

export const calculateAdherence = (schedule, attendance, breaks) => {
  if (!schedule || !attendance) return 0;
  
  // Calculate scheduled work time
  const schedStart = new Date(`2000-01-01 ${schedule.start}`);
  const schedEnd = new Date(`2000-01-01 ${schedule.end}`);
  const scheduledMinutes = (schedEnd - schedStart) / 60000;
  
  // Subtract break times
  let breakMinutes = 0;
  breaks.forEach(brk => {
    if (brk.end) {
      const breakDuration = (new Date(brk.end) - new Date(brk.start)) / 60000;
      breakMinutes += breakDuration;
    }
  });
  
  const actualWorkMinutes = scheduledMinutes - breakMinutes;
  return scheduledMinutes > 0 ? (actualWorkMinutes / scheduledMinutes) * 100 : 0;
};

export const calculateTeamCoverage = (clientId, startDate, endDate, clients, clientAssignments, schedules, attendance, breaks) => {
  const reports = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    const report = calculateCoverageReport(
      clientId, 
      d.toISOString().split('T')[0], 
      clients, 
      clientAssignments, 
      schedules, 
      attendance, 
      breaks
    );
    
    if (!report.error) {
      reports.push(report);
    }
  }
  
  return reports;
};
