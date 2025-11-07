export const INFRACTION_RULES = {
  MINOR: {
    level: "Minor Infraction",
    instances: [
      { instance: "1st Infraction", measure: "First Formal Warning (Documented)", cleansingPeriod: "Two (2) months" },
      { instance: "2nd Infraction", measure: "Written Warning", cleansingPeriod: "Four (4) months" },
      { instance: "3rd Infraction", measure: "Final Written Warning", cleansingPeriod: "Six (6) months" },
      { instance: "4th Infraction", measure: "Notice of Dismissal", cleansingPeriod: "Not applicable" },
    ],
    note: "Management may place an erring employee on preventive suspension while an administrative investigation is being conducted for the 1st to 3rd Infractions."
  },
  LESS_SERIOUS: {
    level: "Less Serious Infraction",
    instances: [
      { instance: "1st Infraction", measure: "Written Warning", cleansingPeriod: "Four (4) months" },
      { instance: "2nd Infraction", measure: "Final Written Warning", cleansingPeriod: "Six (6) months" },
      { instance: "3rd Infraction", measure: "Notice of Dismissal", cleansingPeriod: "Not applicable" },
    ],
    note: "Management may place an erring employee on preventive suspension while an administrative investigation is being conducted for the 1st to 2nd Infractions."
  },
  SERIOUS: {
    level: "Serious Infraction",
    instances: [
      { instance: "1st Infraction", measure: "Notice of Dismissal", cleansingPeriod: "Not applicable" },
    ],
    note: "Serious Infractions include: Gross Misconduct, Wilful Disobedience, Gross Negligence, Fraud, Commission of a Crime or Offense against the Company and Co-Employees. Punishment depends on the gravity of the offense and surrounding circumstances."
  },

  // RULE I: PROPER CONDUCT and BEHAVIOR
  'I-1': { rule: 'I-1', section: '1', description: 'Eating and/or smoking in prohibited areas', level: 'Minor Infraction' },
  'I-2': { rule: 'I-2', section: '1', description: 'Bringing in unauthorized materials inside Production floor (open mugs, merchandise, personal belongings)', level: 'Minor Infraction' },
  'I-3': { rule: 'I-3', section: '1', description: 'Creating noise or disturbance, engaging in horseplay, mischief during office hours', level: 'Minor Infraction' },
  'I-4': { rule: 'I-4', section: '1', description: 'Littering, causing poor sanitary conditions, failure to obey sanitary rules', level: 'Minor Infraction' },
  'I-5': { rule: 'I-5', section: '1', description: 'Non-compliance to prescribed Uniform/attire or dress code', level: 'Minor Infraction' },
  'I-6': { rule: 'I-6', section: '1', description: 'Not wearing Company ID within Company premises', level: 'Minor Infraction' },
  'I-7': { rule: 'I-7', section: '1', description: 'Unauthorized entry to restricted areas of the Company', level: 'Less Serious Infraction' },
  'I-8': { rule: 'I-8', section: '1', description: 'Unauthorized use or abuse of sleeping quarters and company resting areas', level: 'Less Serious Infraction' },
  'I-9': { rule: 'I-9', section: '1', description: 'Vandalism in Company property; unauthorized removal/defacing of notices from bulletin boards', level: 'Less Serious Infraction' },
  'I-10': { rule: 'I-10', section: '1', description: 'Minor destruction of company property', level: 'Less Serious Infraction' },
  'I-11': { rule: 'I-11', section: '1', description: 'Unauthorized bringing out of Company equipment, files, records, documents, properties', level: 'Less Serious Infraction' },
  'I-12': { rule: 'I-12', section: '1', description: 'Refusal to undergo annual medical test/examination (X-ray, Drug Test, Laboratory tests)', level: 'Less Serious Infraction' },
  'I-13': { rule: 'I-13', section: '1', description: 'Making derogatory references to race, ethnicity, religion, marital status, age, disabilities, sexual preference or gender', level: 'Less Serious Infraction' },
  'I-14': { rule: 'I-14', section: '1', description: 'Giving false and but not material information in application form and other company documents', level: 'Less Serious Infraction' },
  'I-15': { rule: 'I-15', section: '1', description: 'Bloating statistics in performance report', level: 'Less Serious Infraction' },
  'I-18': { rule: 'I-18', section: '1', description: 'Leaving work area or work station without permission (Abandonment of Post)', level: 'Less Serious Infraction' },
  'I-19': { rule: 'I-19', section: '1', description: 'Reporting to work under the influence of liquor or drinking liquor inside Company premises', level: 'Serious Infraction' },
  'I-20': { rule: 'I-20', section: '1', description: 'Possession, selling or using prohibited drugs and possession of drug paraphernalia', level: 'Serious Infraction' },
  'I-21': { rule: 'I-21', section: '1', description: 'Use of Company owned phone or landline for personal IDD/NDD/Mobile use without authorization', level: 'Serious Infraction' },
  'I-22': { rule: 'I-22', section: '1', description: 'Destruction of company property', level: 'Serious Infraction' },
  'I-24': { rule: 'I-24', section: '1', description: 'Disclosure of highly sensitive and confidential information (employee compensation, medical records, trade secrets, client information). Violation of Non-Disclosure Agreement', level: 'Serious Infraction' },
  'I-25': { rule: 'I-25', section: '1', description: 'Demonstrating discourtesy (impatience, sarcasm, rudeness, yelling, screaming, unreasonable behavior)', level: 'Serious Infraction' },
  'I-26': { rule: 'I-26', section: '1', description: 'Threat, verbal assault, provocation, intimidation, coercion, rowdiness, or harassment', level: 'Serious Infraction' },
  'I-27': { rule: 'I-27', section: '1', description: 'Use of profanity, vulgar, offensive, abusive or sexually oriented language', level: 'Serious Infraction' },
  'I-28': { rule: 'I-28', section: '1', description: 'Engaging in scandalous or immoral acts (pornographic materials, sexual harassment, immoral acts)', level: 'Serious Infraction' },
  'I-29': { rule: 'I-29', section: '1', description: 'Fighting or instigating/provoking any fight whether verbal or physical, including mauling', level: 'Serious Infraction' },
  'I-31': { rule: 'I-31', section: '1', description: 'Malicious comments or posts in Social Media about the Company, clients, partners, processes that may cause damage to reputation', level: 'Serious Infraction' },
  'I-32': { rule: 'I-32', section: '1', description: 'Gambling, betting or taking part in any forms of game of chance within Company premises during office hours', level: 'Serious Infraction' },
  'I-34': { rule: 'I-34', section: '1', description: 'Engaging in business transactions involving lending of money to another employee for profit', level: 'Serious Infraction' },
  'I-35': { rule: 'I-35', section: '1', description: 'Misuse or abuse of authority (actions in excess of authority, wrongful/malicious acts, taking advantage of rank)', level: 'Serious Infraction' },
  'I-46': { rule: 'I-46', section: '1', description: 'Sexual Harassment as defined by law', level: 'Serious Infraction' },
  'I-50': { rule: 'I-50', section: '1', description: 'Sleeping while on duty/shift', level: 'Serious Infraction' },
  'I-53': { rule: 'I-53', section: '1', description: 'Unauthorized access of non-business related websites (Facebook, YouTube, etc.)', level: 'Less Serious Infraction' },

  // RULE II: INSUBORDINATION
  'II-1': { rule: 'II-1', section: '2', description: 'Willful disobedience of lawful orders and regulations of the Company', level: 'Serious Infraction' },
  'II-2': { rule: 'II-2', section: '2', description: 'Willfully refusing to render overtime despite due notice', level: 'Serious Infraction' },
  'II-3': { rule: 'II-3', section: '2', description: 'Deliberate refusal to attend administrative hearings, withholding vital information', level: 'Serious Infraction' },
  'II-7': { rule: 'II-7', section: '2', description: 'Willful disobedience without just and lawful excuse of any Company policy', level: 'Serious Infraction' },
  'II-8': { rule: 'II-8', section: '2', description: 'Failure or deliberate refusal to acknowledge or confirm online issued NTEs, NODs, PSP documents, coaching logs', level: 'Minor Infraction' },

  // RULE III: NEGLIGENCE and NEGLECT of OFFICIAL DUTIES
  'III-1': { rule: 'III-1', section: '3', description: 'Loafing, loitering, slacking-off, dozing-off, wasting time during working hours', level: 'Minor Infraction' },
  'III-2': { rule: 'III-2', section: '3', description: 'Simple neglect of duty - failure to give proper attention to a task', level: 'Minor Infraction' },
  'III-3': { rule: 'III-3', section: '3', description: 'Performing personal activities during office hours (selling goods, entertaining visitors, playing games)', level: 'Minor Infraction' },
  'III-12': { rule: 'III-12', section: '3', description: 'Gross and habitual neglect of official duties', level: 'Serious Infraction' },
  'III-15': { rule: 'III-15', section: '3', description: 'Consistent poor performance and inefficiency - failure to meet performance standards', level: 'Serious Infraction' },
  'III-18': { rule: 'III-18', section: '3', description: 'Dead air, remaining silent or keeping on mute or manipulating telephone to disconnect call', level: 'Less Serious Infraction' },
  'III-19': { rule: 'III-19', section: '3', description: 'Voice or Non-Voice Interaction Avoidance (intentional disconnect, unauthorized dropping of calls, call riding)', level: 'Serious Infraction' },
  'III-20': { rule: 'III-20', section: '3', description: 'Failure to follow quality guidelines resulting to markdowns and/or call outs on QA audits', level: 'Minor Infraction' },

  // RULE IV: ATTENDANCE AND PUNCTUALITY
  'IV-1': { rule: 'IV-1', section: '4', description: 'Failure to log-in and log-out on timekeeping tool or failure to confirm attendance records', level: 'Minor Infraction' },
  'IV-2': { rule: 'IV-2', section: '4', description: 'Non-adherence to prescribed work schedule (3 instances of tardiness or 30 minutes accumulated tardiness within 30 days)', level: 'Minor Infraction' },
  'IV-3': { rule: 'IV-3', section: '4', description: 'No Call No Show (NCNS) / Absence Without Official Leave (AWOL) - failure to report for work and advise supervisor within 2 hours before shift', level: 'Less Serious Infraction' },
  'IV-6a': { rule: 'IV-6a', section: '4', description: 'Abandonment - One (1) day absence without official leave', level: 'Minor Infraction' },
  'IV-6b': { rule: 'IV-6b', section: '4', description: 'Abandonment - Two (2) consecutive days absence without official leave', level: 'Less Serious Infraction' },
  'IV-6c': { rule: 'IV-6c', section: '4', description: 'Abandonment - Three (3) consecutive days absence without official leave', level: 'Serious Infraction' },
  'IV-7': { rule: 'IV-7', section: '4', description: 'Abandonment of post for more than 4 hours in one shift', level: 'Serious Infraction' },

  // RULE V: FRAUD AND WILLFUL BREACH OF TRUST
  'V-3': { rule: 'V-3', section: '5', description: 'Deliberate non-disclosure of any infectious or contagious ailment', level: 'Serious Infraction' },
  'V-6': { rule: 'V-6', section: '5', description: 'Disclosure of Company trade secrets and confidential information (giving away, selling client information, company practices)', level: 'Serious Infraction' },
  'V-7': { rule: 'V-7', section: '5', description: 'Cheating during Training Examinations and/or any qualifying examination/assessment', level: 'Serious Infraction' },
  'V-8': { rule: 'V-8', section: '5', description: 'Moonlighting - rendering services for another employer without knowledge or approval of the Company', level: 'Serious Infraction' },
  'V-12': { rule: 'V-12', section: '5', description: 'Falsification of Company records, production reports, vouchers, official receipts', level: 'Serious Infraction' },
  'V-14': { rule: 'V-14', section: '5', description: 'Malingering or Feigning sickness', level: 'Serious Infraction' },
  'V-15': { rule: 'V-15', section: '5', description: 'False charging of overtime work', level: 'Serious Infraction' },
  'V-16': { rule: 'V-16', section: '5', description: 'Falsifying time and/or attendance records or punching-in an employee who is tardy, under time or absent', level: 'Serious Infraction' },
  'V-18': { rule: 'V-18', section: '5', description: 'Stealing or theft of company property', level: 'Serious Infraction' },
  'V-21': { rule: 'V-21', section: '5', description: 'Misleading the customer where information was critical in closing sale/transaction or resolving customer concern', level: 'Serious Infraction' },
  'V-22': { rule: 'V-22', section: '5', description: 'Fraudulent transactions during call (slamming, cramming, unauthorized use of customer information, survey begging, system manipulation)', level: 'Serious Infraction' },
  'V-23': { rule: 'V-23', section: '5', description: 'Submission of falsified or tampered document or giving false information during employment application', level: 'Serious Infraction' },

  // RULE VI: CRIMINAL ACTS
  'VI-1a': { rule: 'VI-1a', section: '6', description: 'Corruption of Public officials - offering, giving, receiving, or soliciting money, gifts or material favor', level: 'Serious Infraction' },
  'VI-1b': { rule: 'VI-1b', section: '6', description: 'Acts of Violence - inflicting or causing bodily or physical pain, injury to any employee or person', level: 'Serious Infraction' },
  'VI-1c': { rule: 'VI-1c', section: '6', description: 'Possession of firearms, deadly weapons and explosives including firecrackers within Company premises', level: 'Serious Infraction' },
  'VI-1d': { rule: 'VI-1d', section: '6', description: 'Drug use and drug pushing within company premises', level: 'Serious Infraction' },
  'VI-1e': { rule: 'VI-1e', section: '6', description: 'Theft or Robbery', level: 'Serious Infraction' },
  'VI-1f': { rule: 'VI-1f', section: '6', description: 'Arson; destroying or damaging property, systems, records or information', level: 'Serious Infraction' },
  'VI-1j': { rule: 'VI-1j', section: '6', description: 'Falsification - misrepresenting a fact or altering a document, counterfeiting handwriting or signature', level: 'Serious Infraction' },
  'VI-1k': { rule: 'VI-1k', section: '6', description: 'Sexual Harassment under Anti-sexual Harassment Law (Republic Act 7877)', level: 'Serious Infraction' },
};
