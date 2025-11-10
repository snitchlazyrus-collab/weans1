import { useState, useEffect, useCallback } from 'react';
import { INFRACTION_RULES } from '../constants/infractionRules';

const useInfractions = (db, addToFeed, INFRACTION_RULES) => {
  const [infractions, setInfractions] = useState([]);

  const loadInfractions = useCallback(async () => {
    const data = await db.get('infractions') || [];
    setInfractions(data);
  }, [db]);

  useEffect(() => {
    loadInfractions();
  }, [loadInfractions]);

  const getOrdinalSuffix = (num) => {
    if (num === 1) return 'st';
    if (num === 2) return 'nd';
    if (num === 3) return 'rd';
    return 'th';
  };

  const postInfraction = useCallback(async (employeeId, ruleCode, additionalNotes) => {
    try {
      const rule = INFRACTION_RULES[ruleCode];
      if (!rule) {
        return { error: 'Invalid infraction rule code!' };
      }

      const irsData = [...(await db.get('infractions') || [])];
      const employeeInfractions = irsData.filter(
        ir => ir.employeeId === employeeId && ir.ruleCode === ruleCode
      );
      const occurrenceCount = employeeInfractions.length + 1;

      irsData.push({
        id: Date.now(),
        employeeId,
        ruleCode,
        rule: rule.rule,
        section: rule.section,
        description: rule.description,
        level: rule.level,
        additionalNotes: additionalNotes || '',
        occurrenceCount,
        date: new Date().toISOString(),
        acknowledged: false,
        signature: null,
        comment: ''
      });

      await db.set('infractions', irsData);
      setInfractions(irsData);

      const suffix = getOrdinalSuffix(occurrenceCount);
      addToFeed(
        `⚠️ Infraction issued to ${employeeId} (${rule.level} - ${occurrenceCount}${suffix} offense)`,
        'infraction'
      );

      return {
        success: `Infraction issued. This is the ${occurrenceCount}${suffix} offense for this rule.`
      };
    } catch (error) {
      return { error: 'Failed to post infraction: ' + error.message };
    }
  }, [db, addToFeed, INFRACTION_RULES]);

  const acknowledgeInfraction = useCallback(async (infractionId, comment, signature) => {
    try {
      const data = [...(await db.get('infractions') || [])];
      const item = data.find(i => i.id === infractionId);
      if (!item) return { error: 'Infraction not found!' };

      item.acknowledged = true;
      item.signature = signature;
      item.comment = comment;

      await db.set('infractions', data);
      setInfractions(data);

      return { success: 'Acknowledged! ✅' };
    } catch (error) {
      return { error: 'Failed to acknowledge: ' + error.message };
    }
  }, [db]);

  return {
    infractions,
    postInfraction,
    acknowledgeInfraction,
    loadInfractions,
    setInfractions,
  };
};

export default useInfractions;
