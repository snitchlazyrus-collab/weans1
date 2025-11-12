// Auto-coaching configuration constants
export const AUTO_COACHING_CUTOFF_DATE = new Date('2025-11-15T00:00:00');

export const BREAK_LIMITS = {
  'break1': 15,
  'break2': 15,
  'lunch': 60
};

export const VIOLATION_RULES = {
  tardiness: {
    label: 'Tardiness',
    ruleCode: 'IV-2',
    handbook: 'RULE IV: ATTENDANCE AND PUNCTUALITY - Section 2a: Tardiness – Three (3) instances of tardiness or at least thirty (30) minutes of accumulated tardiness within 30 days shall warrant a first notice. (Minor Infraction)',
    consequence: 'Progressive discipline will be applied: First Formal Warning → Written Warning → Final Written Warning → Notice of Dismissal',
    thresholds: {
      count: 3,
      minutes: 30
    }
  },
  overbreak: {
    label: 'Over Break',
    ruleCode: 'IV-2b',
    handbook: 'RULE IV: ATTENDANCE AND PUNCTUALITY - Section 2b: Over Break – Three (3) instances of over break within 30 days shall warrant a first notice. (Minor Infraction)',
    consequence: 'Progressive discipline will be applied: First Formal Warning → Written Warning → Final Written Warning → Notice of Dismissal',
    thresholds: {
      count: 3
    }
  },
  absence: {
    label: 'Absence / NCNS',
    ruleCode: 'IV-3',
    handbook: 'RULE IV: ATTENDANCE AND PUNCTUALITY - Section 3: No Call No Show (NCNS) / Absence Without Official Leave (AWOL) or failure to report for work and advise immediate superior regarding the absence within 2 hours before the scheduled shift. (Less Serious Infraction)',
    consequence: 'Progressive discipline will be applied: Written Warning → Final Written Warning → Notice of Dismissal. Three (3) consecutive days of absence without official leave is considered a Serious Infraction and may result in immediate dismissal.',
    thresholds: {
      consecutiveForSerious: 3
    }
  }
};
