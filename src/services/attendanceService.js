/**
 * Mark user as present
 */
export const markPresentService = async (db, currentUser, addToFeed) => {
  try {
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
    await addToFeed(`${currentUser.name} has arrived! 🎯`, 'attendance', currentUser);
    
    return {
      success: true,
      attendance: attendanceData,
      message: 'Marked present! Waiting for admin approval... ⏳'
    };
  } catch (err) {
    return {
      success: false,
      error: 'Failed to mark attendance: ' + err.message
    };
  }
};

/**
 * Approve attendance for a user
 */
export const approveAttendanceService = async (db, date, employeeId) => {
  try {
    const attendanceData = await db.get('attendance') || {};
    
    if (attendanceData[date] && attendanceData[date][employeeId]) {
      attendanceData[date][employeeId].approved = true;
      await db.set('attendance', attendanceData);
      
      return {
        success: true,
        attendance: attendanceData
      };
    }
    
    return {
      success: false,
      error: 'Attendance record not found'
    };
  } catch (err) {
    return {
      success: false,
      error: 'Failed to approve attendance: ' + err.message
    };
  }
};
