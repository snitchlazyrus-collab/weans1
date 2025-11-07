import { useState } from 'react';

const useAttendance = (db, currentUser, addToFeed) => {
  const [attendance, setAttendance] = useState({});

  const markPresent = async () => {
    const today = new Date().toDateString();
    const attendanceData = await db.get('attendance') || {};

    if (!attendanceData[today]) attendanceData[today] = {};

    attendanceData[today][currentUser.employeeId] = {
      status: 'present',
      time: new Date().toLocaleTimeString(),
      approved: false,
      username: currentUser.username,
      name: currentUser.name
    };

    await db.set('attendance', attendanceData);
    setAttendance(attendanceData);
    addToFeed(`${currentUser.name} has arrived! 🎯`, 'attendance');
    return { success: 'Marked present! Waiting for admin approval... ⏳' };
  };

  const approveAttendance = async (date, employeeId) => {
    const attendanceData = await db.get('attendance') || {};
    if (attendanceData[date] && attendanceData[date][employeeId]) {
      attendanceData[date][employeeId].approved = true;
      await db.set('attendance', attendanceData);
      setAttendance(attendanceData);
      return { success: 'Attendance approved! ✅' };
    }
    return { error: 'Attendance record not found!' };
  };

  const loadAttendance = async () => {
    const data = await db.get('attendance') || {};
    setAttendance(data);
  };

  return {
    attendance,
    markPresent,
    approveAttendance,
    loadAttendance,
    setAttendance,
  };
};

export default useAttendance;
