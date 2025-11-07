import { useState } from 'react';

const useInfractions = (db, addToFeed, INFRACTION_RULES) => {
  const [infractions, setInfractions] = useState([]);

  const postInfraction = async (employeeId, ruleCode, additionalNotes) => {
    try {
      const rule = INFRACTION_RULES[ruleCode];
      if (!rule) {
        return { error: 'Invalid infraction rule code!' };
      }

      const existingIrs = await db.get('infractions') || [];
      const employeeInfractions = existingIrs.filter(ir =>
        ir.employeeId === employeeId && ir.ruleCode === ruleCode
      );

      const occurrenceCount = employeeInfractions.length + 1;

      const irsData = await db.get('infractions') || [];
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
      addToFeed(`⚠️ Infraction report issued to ${employeeId} (${rule.level} - ${occurrenceCount}${occurrenceCount === 1 ? 'st' : occurrenceCount === 2 ? 'nd' : occurrenceCount === 3 ? 'rd' : 'th'} offense)`, 'infraction');
      return { 
        success: `Infraction issued! This is the ${occurrenceCount}${occurrenceCount === 1 ? 'st' : occurrenceCount === 2 ? 'nd' : occurrenceCount === 3 ? 'rd' : 'th'} offense for this rule.` 
      };
    } catch (error) {
      return { error: 'Failed to post infraction: ' + error.message };
    }
  };

  const acknowledgeInfraction = async (infractionId, comment, signature) => {
    try {
      const data = await db.get('infractions') || [];
      const item = data.find(i => i.id === infractionId);
      if (item) {
        item.acknowledged = true;
        item.signature = signature;
        item.comment = comment;
        await db.set('infractions', data);
        setInfractions(data);
        return { success: 'Acknowledged! ✅' };
      }
      return { error: 'Infraction not found!' };
    } catch (error) {
      return { error: 'Failed to acknowledge: ' + error.message };
    }
  };

  const loadInfractions = async () => {
    const data = await db.get('infractions') || [];
    setInfractions(data);
  };

  return {
    infractions,
    postInfraction,
    acknowledgeInfraction,
    loadInfractions,
    setInfractions,
  };
};

export default useInfractions;
