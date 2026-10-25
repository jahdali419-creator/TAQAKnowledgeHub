/* ──────────────────────────────────────────────────────────────────────────
   RISE Field Cases: data
   ──────────────────────────────────────────────────────────────────────────
   Everything a case page offers as a choice, and the shape of a case, kept
   in one file so the library, the form, the case page and the pre-job pack
   can never disagree. cases.js reads this file; pages read it through
   TAQA_CASES (cases.js), never directly.

   Source: the TAQA Applied Intelligence business case (content types,
   shared fields, the incident card, drilling's services and endings) and,
   for every other operational segment, the titles of that segment's own
   SOPs in segments-data.js (TAQA_SEGMENTS[id].docs.sops). No product name
   here was invented: where a segment's SOPs name no product, the service
   is the operation the SOP describes.

   Plain data only: no functions, nothing that runs.
   ────────────────────────────────────────────────────────────────────── */

/* ── Shipped cases ────────────────────────────────────────────────────────
   Real cases the owner sends later go here. They are PUBLISHED library
   entries, not register records: they never change the register's counts,
   queues or Master List figures, and they do not go through QMS or the
   Director in this preview (the owner has already cleared them).

   Empty tonight, on purpose: RISE never shows an invented case.

   Record shape (copy one block per case; every value is plain text unless
   noted, and anything not known is left out or empty, never guessed):

   {
     id: 'DRL-2026-001',            // required, unique, letters, digits and hyphens only; case.html?id=<id>
     type: 'incident',              // required, one of TAQA_CASES.TYPES keys:
                                    //   case-study, lesson, incident, prejob, appreciation,
                                    //   practice, field-profile, benchmark, alert, training
     area: 'drilling',              // required, an operational segment id (TAQA_CASES.operational())
     title: '...',                  // required
     summary: '...',                // required, one paragraph
     publishedDate: '2026-10-01',   // required, YYYY-MM-DD, when the owner cleared it
     classification: 'internal',    // 'internal' (default), 'confidential' or 'restricted'
     docNumber: '',                 // optional: the RISE number if the case also exists as a document
     card: {                        // required: the same card a filed case carries (TAQA_CASE_FIELDS)
       v: 1,
       type: 'incident', area: 'drilling',
       location: 'Saudi Arabia',            // one of OPTIONS.locations, or the typed place
       services: ['DTECH RSS'],             // option values, or typed text for Other
       eventMonth: '2026-08',               // YYYY-MM
       customer: '', field: '', wellRef: '', holeSize: '8 1/2', formation: '',
       sourceDoc: 'TQ-TDS-DSS-...',         // required: where the facts came from
       authorRole: 'Field Engineer',        // a role, never a name
       salesReady: false,
       sections: { },                       // the type's own fields, keys as in TAQA_CASE_FIELDS.sections[type]
       incident: { }                        // incident type only, keys as in TAQA_CASE_FIELDS.incident
     }
   }
   ────────────────────────────────────────────────────────────────────── */
var TAQA_CASES_SHIPPED = [];

/* ── Option lists ─────────────────────────────────────────────────────── */
var TAQA_CASE_OPTIONS = {
  // The value a person picks to type their own entry instead. A saved case
  // never stores 'Other': it stores what was typed.
  other: 'Other',

  // Business case: where TAQA operates.
  locations: ['Saudi Arabia', 'Pakistan', 'India', 'NAM', 'Turkey', 'UAE', 'Other'],

  /* Services and tools per operational segment, each ending in 'Other'.
     drilling: the business case, verbatim. Every other segment: the
     operations named by its own SOP titles (segments-data.js), with the SOP
     each came from beside it. */
  services: {
    'drilling': ['DTECH RSS', 'Azem RSS', 'MM5 motor', 'Telefusion', 'APS', 'VERTEX', 'ION', 'Jar',
                 'Shock subs', 'THRUSTER', 'THRELIX', 'Drilling engineering', 'Other'],
    'coiled-tubing': [
      'Nitrogen injection',          // CT-007 Nitrogen Injection SOP
      'Milling',                     // CT-008 Milling Operations SOP
      'Acid stimulation',            // CT-009 Acid Stimulation SOP
      'Fishing',                     // CT-010 Fishing Operations SOP
      'Logging while CT',            // CT-011 Logging While CT SOP
      'Other'],
    'fracturing': [
      'Multi-stage frac',            // FRAC-009 Multi-Stage Frac SOP
      'Treatment execution',         // FRAC-006 Treatment Execution SOP
      'Acid pre-flush',              // FRAC-010 Acid Pre-Flush SOP
      'Fluid mixing',                // FRAC-004 Fluid Mixing SOP
      'Proppant handling',           // FRAC-005 Proppant Handling SOP
      'Chemical additives',          // FRAC-011 Chemical Additive SOP
      'Blender operations',          // FRAC-014 Blender Operations SOP
      'Data van operations',         // FRAC-013 Data Van Operations SOP
      'Flowback',                    // FRAC-008 Post-Job Flowback SOP
      'Screen-out response',         // FRAC-017 Screen-Out Response SOP
      'Other'],
    'wireline': [
      'Perforation',                 // WL-003 Perforation Operations SOP
      'Memory logging',              // WL-005 Memory Logging SOP
      'Pump-down operations',        // WL-006 Pump-Down Operations SOP
      'Slickline tool running',      // WL-004 Slickline Tool Running SOP
      'Tool string assembly',        // WL-002 Tool String Assembly SOP
      'Well re-entry',               // WL-010 Well Re-Entry SOP
      'Emergency recovery',          // WL-008 Emergency Recovery SOP
      'Logging data QC',             // WL-009 Logging Data QC SOP
      'Other'],
    'cementing': [
      'Primary cementing',           // CEM-003 Primary Cement Job SOP
      'Liner cementing',             // CEM-009 Liner Cementing SOP
      'Remedial squeeze',            // CEM-008 Remedial Squeeze SOP
      'Batch mixing',                // CEM-002 Batch Mixing SOP
      'Displacement',                // CEM-004 Displacement Procedure
      'Float equipment',             // CEM-006 Float Equipment SOP
      'Centralizer placement',       // CEM-007 Centralizer Placement SOP
      'Pressure test',               // CEM-005 Pressure Test SOP
      'Thickening time test',        // CEM-010 Thickening Time Test SOP
      'Free water test',             // CEM-011 Free Water Test SOP
      'Other'],
    'inspection': [
      'Visual inspection',           // INS-001 Visual Inspection SOP
      'MPI inspection',              // INS-002 MPI Inspection SOP
      'UT wall thickness',           // INS-003 UT Wall Thickness SOP
      'Pressure test inspection',    // INS-004 Pressure Test Inspection SOP
      'Tubular inspection',          // INS-005 Tubular Inspection SOP
      'BOP inspection',              // INS-006 BOP Inspection SOP
      'Valve inspection',            // INS-007 Valve Inspection SOP
      'Crane inspection',            // INS-008 Crane Inspection SOP
      'Lifting equipment inspection',// INS-009 Lifting Equipment SOP
      'Vehicle inspection',          // INS-010 Vehicle Inspection SOP
      'Calibration management',      // INS-015 Calibration Management SOP
      'Other'],
    'well-safety': [
      'BOP testing',                 // WS-001 Daily BOP Test SOP
      'Kill sheet preparation',      // WS-002 Kill Sheet Preparation SOP
      'Well shut-in',                // WS-003 Well Shut-In Procedure
      'Stripping operations',        // WS-005 Stripping Operations SOP
      'Bullheading',                 // WS-006 Bullheading SOP
      'H2S alarm response',          // WS-008 H2S Alarm Response SOP
      'Surface well test',           // WS-009 Surface Well Test SOP
      'Wireline BOP test',           // WS-010 Wireline BOP Test SOP
      'CT BOP operations',           // WS-011 CT BOP Operations SOP
      'IBOP',                        // WS-012 IBOP SOP
      'Barrier verification',        // WS-016 Barrier Verification SOP
      'Well integrity monitoring',   // WS-017 Well Integrity Monitoring SOP
      'Casing pressure management',  // WS-018 Casing Pressure Management
      'Annular pressure build-up',   // WS-019 Annular Pressure Build-Up SOP
      'Other'],
    'well-testing': [
      'Surface testing equipment',   // WT-002 Surface Testing Equipment Rig-Up SOP
      'DST operations',              // WT-003 DST Operations SOP
      'Pressure buildup test',       // WT-004 Pressure Buildup Test SOP
      'Multi-rate flow test',        // WT-005 Multi-Rate Flow Test SOP
      'Well cleanup',                // WT-006 Well Cleanup SOP
      'Separator operations',        // WT-007 Separator Operations SOP
      'Data acquisition',            // WT-009 Data Acquisition SOP
      'Other'],
    'slickline': [
      'Pressure control equipment',  // Slickline Pressure Control Equipment Rig-Up
      'Wireline valve function test',// Wireline Valve Function Test
      'Other'],
    'well-completions': [
      'Completion string running',   // Completion String Running Procedure
      'Production packer setting and testing', // Production Packer Setting and Testing
      'Other'],
    'marine-services': [
      'Vessel mobilisation',         // Vessel Mobilisation Checklist
      'Cargo securing and sea fastening', // Cargo Securing and Sea Fastening
      'Man overboard response',      // Man Overboard Response
      'Other']
  },

  // Business case, incident card section 1. One list for every segment.
  incidentTypes: ['Hydraulics and pressure', 'Drill string, jars and connections', 'Downhole tool / motor',
                  'MWD / LWD / survey', 'Stuck pipe / hole problem', 'Surface equipment', 'Well control', 'Other'],

  /* How it ended (incident card section 5). value is what is stored and
     shown as the chip; hint explains it under the choice. */
  endings: {
    'drilling': [
      { value: 'POOH', label: 'POOH', hint: 'Tripped out to inspect or change the BHA' },
      { value: 'Troubleshooting', label: 'Troubleshooting', hint: 'Still working the problem on bottom or in hole' },
      { value: 'CIRC', label: 'CIRC', hint: 'Circulating to clean up or monitor' },
      { value: 'Drilling ahead', label: 'Drilling ahead', hint: 'Problem cleared or managed' }
    ],
    'default': [
      { value: 'Pulled out of hole', label: 'Pulled out of hole', hint: '' },
      { value: 'Troubleshooting continued', label: 'Troubleshooting continued', hint: '' },
      { value: 'Circulating / monitoring', label: 'Circulating / monitoring', hint: '' },
      { value: 'Job continued', label: 'Job continued', hint: '' },
      { value: 'Job suspended', label: 'Job suspended', hint: '' }
    ]
  },

  // The ending that makes "Findings at surface" required.
  tripOut: { 'drilling': 'POOH', 'default': 'Pulled out of hole' },

  // Findings at surface (incident card section 6): chips.
  findings: {
    'drilling': ['Bit dull grade', 'Nozzles', 'Motor (stator, rotor, bearings, connections)', 'Reamer or stabilisers',
                 'MWD pulser / filter screen', 'Connections and threads', 'Washouts, cracks, junk', 'Photos taken'],
    'default': ['Tool or equipment damage', 'Connections and threads', 'Seals and elastomers', 'Washouts, cracks, junk', 'Photos taken']
  },

  // What was tried (incident card section 4): the result of each action.
  results: ['Failed', 'Partial', 'Worked'],

  /* Common hole sizes in inches, offered as suggestions only: any value may
     be typed. Stored as typed; TAQA_CASES.holeNumber() compares them. */
  holeSizes: ['26', '17 1/2', '16', '12 1/4', '8 1/2', '6 1/8', '6', '5 7/8', '4 3/4'],

  /* Class: RISE's own classification (roles.js). hint says who can open it,
     because a Segment Director is not cleared for Restricted, so a
     Restricted case waits at final approval until an authorised approver is
     assigned (BD-08). */
  classes: [
    { value: 'internal', label: 'Internal', hint: 'Every TAQA employee can read it once it is released.' },
    { value: 'confidential', label: 'Confidential', hint: 'Directors, Maintenance Managers, QMS and auditors only. Employees cannot open it.' },
    { value: 'restricted', label: 'Restricted', hint: 'QMS and auditors only. No Segment Director is cleared for it, so it waits at final approval until an authorised approver is assigned.' }
  ]
};

/* ── The shape of a case ──────────────────────────────────────────────────
   kind: text | textarea | month (YYYY-MM) | date (YYYY-MM-DD) | time (hh:mm)
         | number | select | multi | check | chips | rows
   key paths: shared fields live on the card itself (card.location), the
   type's own fields under card.sections, the incident card under
   card.incident. title and summary are also the register record's own
   title and summary; classification is the record's classification.
   options names a list in TAQA_CASE_OPTIONS (read through TAQA_CASES.OPTIONS,
   which resolves per-area lists). */
var TAQA_CASE_FIELDS = {
  shared: [
    { key: 'type',        label: 'Content type',           kind: 'select', required: true, options: 'types' },
    { key: 'area',        label: 'Area',                   kind: 'select', required: true, options: 'operational' },
    { key: 'location',    label: 'Location',               kind: 'select', required: true, options: 'locations', other: true },
    { key: 'services',    label: 'Service(s) / tool(s)',   kind: 'multi',  required: true, options: 'services', other: true },
    { key: 'title',       label: 'Title',                  kind: 'text',   required: true, max: 160 },
    { key: 'summary',     label: 'One-paragraph summary',  kind: 'textarea', required: true, max: 1200 },
    { key: 'eventMonth',  label: 'Event month',            kind: 'month',  required: true, hint: 'YYYY-MM' },
    { key: 'customer',    label: 'Customer',               kind: 'text' },
    { key: 'field',       label: 'Field / area',           kind: 'text' },
    { key: 'wellRef',     label: 'Well / rig reference',   kind: 'text', hint: 'Sanitise before any external sharing' },
    { key: 'holeSize',    label: 'Hole size (in)',         kind: 'text', options: 'holeSizes' },
    { key: 'formation',   label: 'Formation / interval',   kind: 'text' },
    { key: 'sourceDoc',   label: 'Source document',        kind: 'text', required: true,
      hint: 'RISE number or file name: where the facts came from. Required for every case.' },
    { key: 'authorRole',  label: 'Author (role)',          kind: 'text', required: true, hint: 'Role, not name' },
    { key: 'classification', label: 'Class',               kind: 'select', options: 'classes' },
    { key: 'salesReady',  label: 'Sales-ready',            kind: 'check', hint: 'Can support a tender or customer meeting' }
  ],

  sections: {
    'case-study': [
      { key: 'challenge',  label: 'Challenge',                  kind: 'textarea', required: true },
      { key: 'action',     label: 'What TAQA did',              kind: 'textarea', required: true },
      { key: 'result',     label: 'Result (quantified)',        kind: 'textarea', required: true, hint: 'Numbers from the source only' },
      { key: 'headline',   label: 'Headline value',             kind: 'text' },
      { key: 'conditions', label: 'Conditions needed to repeat it', kind: 'textarea' }
    ],
    'lesson': [
      { key: 'happened',    label: 'What happened',             kind: 'textarea', required: true },
      { key: 'matters',     label: 'Why it matters',            kind: 'textarea', required: true },
      { key: 'differently', label: 'What to do differently',    kind: 'textarea', required: true },
      { key: 'applies',     label: 'Where it applies',          kind: 'textarea' }
    ],
    // The incident card's six sections are TAQA_CASE_FIELDS.incident.
    'incident': [],
    'prejob': [
      { key: 'objective',      label: 'Job objective',           kind: 'textarea', required: true },
      { key: 'risks',          label: 'Key risks',               kind: 'textarea', required: true },
      { key: 'plan',           label: 'Plan and parameters',     kind: 'textarea', required: true },
      { key: 'lessonsApplied', label: 'Lessons applied (case numbers)', kind: 'text' },
      { key: 'contingencies',  label: 'Contingencies',           kind: 'textarea' }
    ],
    'appreciation': [
      { key: 'recognised',  label: 'What the customer recognised', kind: 'textarea', required: true },
      { key: 'evidence',    label: 'Evidence (letter or email reference)', kind: 'text', required: true },
      // Required before the case may be marked sales-ready (business case:
      // customer-appreciation records also need the sharing permission).
      { key: 'shareAgreed', label: 'The customer agreed this can be shared', kind: 'check' }
    ],
    'practice': [
      { key: 'practice', label: 'The practice',          kind: 'textarea', required: true },
      { key: 'where',    label: 'Where it works',        kind: 'textarea', required: true },
      { key: 'evidence', label: 'Evidence and results',  kind: 'textarea', required: true },
      { key: 'steps',    label: 'Steps',                 kind: 'textarea' }
    ],
    'field-profile': [
      { key: 'fieldName',  label: 'Field',                  kind: 'text',     required: true },
      { key: 'formations', label: 'Formations and hazards', kind: 'textarea', required: true },
      { key: 'works',      label: 'What works',             kind: 'textarea', required: true },
      { key: 'problems',   label: 'Known problems',         kind: 'textarea' }
    ],
    'benchmark': [
      { key: 'metric',     label: 'Metric',          kind: 'text',     required: true },
      { key: 'value',      label: 'Value and unit',  kind: 'text',     required: true },
      { key: 'compared',   label: 'Compared with',   kind: 'textarea', required: true },
      { key: 'conditions', label: 'Conditions',      kind: 'textarea' }
    ],
    'alert': [
      { key: 'tool',     label: 'Tool',             kind: 'text',     required: true },
      { key: 'limit',    label: 'The limit',        kind: 'textarea', required: true },
      { key: 'evidence', label: 'Evidence',         kind: 'textarea', required: true },
      { key: 'action',   label: 'Action required',  kind: 'textarea', required: true }
    ],
    'training': [
      { key: 'topic',     label: 'Topic',                        kind: 'text', required: true },
      { key: 'expertise', label: 'Expertise (role)',             kind: 'text', required: true },
      { key: 'reach',     label: 'How to reach (role or channel)', kind: 'text' },
      { key: 'material',  label: 'Training material reference',  kind: 'text' }
    ]
  },

  /* Failure / incident card. The rules box is shown first, word for word. */
  incidentRules: 'One incident per submission. Write what was observed, not why you think it happened; your explanation has its own box at the end. No personal names: say ‘day crew’ or ‘night crew’. Unsure of a value? Leave it blank. A blank is honest; a guess misleads every later match.',
  incident: [
    { n: 1, title: 'The incident', fields: [
      { key: 'type',        label: 'Incident type',              kind: 'select', required: true, options: 'incidentTypes', other: true },
      { key: 'date',        label: 'Incident date',              kind: 'date',   required: true },
      { key: 'timeNoticed', label: 'Time first noticed',         kind: 'time' },
      { key: 'depthFt',     label: 'Depth at onset (ft MD)',     kind: 'number' },
      { key: 'equipment',   label: 'Equipment / serial numbers', kind: 'text' },
      { key: 'mud',         label: 'Mud or fluid (type and weight)', kind: 'text' },
      { key: 'nptHr',       label: 'NPT (hr)',                   kind: 'number' }
    ] },
    { n: 2, title: 'What was happening', fields: [
      { key: 'activity',   label: 'Activity when it started', kind: 'textarea', required: true },
      { key: 'ongoing',    label: 'Ongoing activity',         kind: 'textarea' },
      { key: 'conditions', label: 'Conditions',               kind: 'textarea' }
    ] },
    { n: 3, title: 'Symptoms, in order', fields: [
      // At least one row with an observation.
      { key: 'symptoms', label: 'Symptoms, in order', kind: 'rows', required: true, min: 1, columns: [
        { key: 'time', label: 'Time', hint: 'hh:mm or T+n min' },
        { key: 'tag',  label: 'Tag (optional)', hint: 'e.g. "SPP above baseline"' },
        { key: 'text', label: 'Observation', required: true }
      ] }
    ] },
    { n: 4, title: 'What was tried', fields: [
      { key: 'tried', label: 'What was tried', kind: 'rows', columns: [
        { key: 'action', label: 'Action', required: true },
        { key: 'result', label: 'Result', required: true, options: 'results' },
        { key: 'note',   label: 'Note' }
      ] }
    ] },
    { n: 5, title: 'How it ended', fields: [
      { key: 'ending', label: 'How it ended', kind: 'select', required: true, options: 'endings' }
      // NPT (hr) is shown here again when section 1 left it blank: it is the
      // same field, incident.nptHr.
    ] },
    { n: 6, title: 'Findings at surface', fields: [
      // Required when the ending is the area's trip out of hole (tripOut).
      { key: 'findings',     label: 'Findings at surface', kind: 'chips', options: 'findings' },
      { key: 'findingsText', label: 'What was found',      kind: 'textarea' },
      { key: 'cause',        label: 'Suspected cause',     kind: 'textarea', hint: 'Hypothesis, not a finding' },
      { key: 'contact',      label: 'Contact for follow-up questions', kind: 'text', hint: 'Role, shown to reviewers only' }
    ] }
  ]
};

if (typeof module !== 'undefined' && module.exports)
  module.exports = { TAQA_CASES_SHIPPED, TAQA_CASE_OPTIONS, TAQA_CASE_FIELDS };
