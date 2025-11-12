import { useState } from 'react';
import { checkTardiness, checkOverbreak, checkAbsence } from '../services/violationDetector';
import { createPendingCoaching } from '../services/autoCoachingService';

/**
 * Custom hook for auto-coaching functionality
 */
export const useAutoCoaching = (db) => {
  const [pendingAutoCoaching, setPendingAutoCoaching] = useState([]);
  const [autoCoachingEnabled, setAutoCoachingEnabledState] = useState(true);

  /**
   * Load pending auto-coaching from database
   */
  const loadPendingAutoCoaching = async () => {
    try {
      const loadedPending = await db.get('pending-auto-coaching');
      setPendingAutoCoaching(Array.isArray(loadedPending) ? loadedPending : []);
    } catch (err) {
      console.error('Error loading pending auto-coaching:', err);
    }
  };

  /**
   * Load auto-coaching enabled setting
   */
  const loadAutoCoachingSetting = async () => {
    try {
      const setting = await db.get('settings/auto-coaching-enabled');
      setAutoCoachingEnabledState(setting !== false);
    } catch (err) {
      console.error('Error loading auto-coaching setting:', err);
    }
  };

  /**
   * Trigger auto-coaching for a violation
   */
  const triggerAutoCoaching = async (violation, employeeName, currentUser, addToFeed) => {
    const pendingCoaching = createPendingCoaching(violation, employeeName, currentUser);

    const updatedPending = [...pendingAutoCoaching, pendingCoaching];
    setPendingAutoCoaching(updatedPending);
    await db.set('pending-auto-coaching', updatedPending);

    const rule = {
      tardiness: 'Tardiness',
      overbreak: 'Over Break',
      absence: 'Absence / NCNS'
    }[violation.type];

    await addToFeed(
      `⏳ PENDING AUTO-COACHING: ${employeeName} triggered ${rule} threshold (${violation.count} incidents) - Awaiting admin approval`,
      'auto-coaching-pending',
      currentUser
    );
  };

  /**
   * Approve a pending auto-coaching log
   */
  const approvePendingCoaching = async (pendingId, postCoachingLog, addToFeed, currentUser) => {
    const pending = pendingAutoCoaching.find(p => p.id === pendingId);
    if (!pending) {
      throw new Error('Pending coaching not found!');
    }

    await postCoachingLog(
      pending.employeeId,
      pending.content,
      pending.category,
      currentUser,
      {
        incidentDates: pending.incidentDates,
        violationData: pending.violationData
      }
    );

    const updatedPending = pendingAutoCoaching.filter(p => p.id !== pendingId);
    setPendingAutoCoaching(updatedPending);
    await db.set('pending-auto-coaching', updatedPending);

    await addToFeed(
      `✅ AUTO-COACHING APPROVED: ${pending.employeeName} - ${pending.category}`,
      'auto-coaching',
      currentUser
    );
  };

  /**
   * Reject/dismiss a pending auto-coaching log
   */
  const rejectPendingCoaching = async (pendingId, addToFeed, currentUser) => {
    const pending = pendingAutoCoaching.find(p => p.id === pendingId);
    if (!pending) {
      throw new Error('Pending coaching not found!');
    }

    const updatedPending = pendingAutoCoaching.filter(p => p.id !== pendingId);
    setPendingAutoCoaching(updatedPending);
    await db.set('pending-auto-coaching', updatedPending);

    await addToFeed(
      `🚫 AUTO-COACHING REJECTED: ${pending.employeeName} - ${pending.category}`,
      'auto-coaching',
      currentUser
    );
  };

  /**
   * Check and trigger auto-coaching for all users
   */
  const checkAndTriggerAutoCoaching = async (users, attendance, breaks, schedules, addToFeed, currentUser) => {
    if (!autoCoachingEnabled) return;

    for (const [username, userData] of Object.entries(users)) {
      if (userData.role === 'admin') continue;

      const violations = await Promise.all([
        checkTardiness(userData.employeeId, attendance, schedules, db),
        checkOverbreak(userData.employeeId, breaks, db),
        checkAbsence(userData.employeeId, attendance, schedules, db)
      ]);

      for (const v of violations) {
        if (v?.triggered) {
          await triggerAutoCoaching(v, userData.name, currentUser, addToFeed);
        }
      }
    }
  };

  /**
   * Set auto-coaching enabled state
   */
  const setAutoCoachingEnabled = async (enabled) => {
    await db.set('settings/auto-coaching-enabled', enabled);
    setAutoCoachingEnabledState(enabled);
  };

  return {
    pendingAutoCoaching,
    autoCoachingEnabled,
    loadPendingAutoCoaching,
    loadAutoCoachingSetting,
    triggerAutoCoaching,
    approvePendingCoaching,
    rejectPendingCoaching,
    checkAndTriggerAutoCoaching,
    setAutoCoachingEnabled,
    checkTardiness: (empId, att, sched) => checkTardiness(empId, att, sched, db),
    checkOverbreak: (empId, brks) => checkOverbreak(empId, brks, db),
    checkAbsence: (empId, att, sched) => checkAbsence(empId, att, sched, db)
  };
};
