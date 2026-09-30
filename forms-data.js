// TAQA Knowledge Hub: form and checklist content (TQ-QHSE-S001 5.3, row 06)
//
// The register (documents-master.js) says what a form IS: its number,
// revision, owner and status. This file says what it ASKS: the job details
// at the top, the checks, and who signs. form.html draws every form from it
// in the one TAQA template, so no two forms can drift apart in layout.
//
// SAMPLE CONTENT. The items below are placeholders written to show the
// template's layout; they are not the approved checklists. Every entry is
// marked sample:true, and form.html says so on screen and on paper, until
// the owner replaces the items with the approved text.
//
// Shape of an entry, keyed by the form's document number:
//   sample     true while the items are placeholders
//   jobFields  the fields at the top, in order
//   sections   [{ title, items: [text, ...] }], each item answered ✓ / ✗ / N/A
//   signoff    the signature blocks at the foot, in order

const TAQA_FORMS = {
  "TQ-TWS-CTSS-F001": {
    sample: true,
    jobFields: ["Well / location", "Date", "Job number", "Crew lead"],
    sections: [
      { title: "Permits and documents", items: [
        "Permit to Work issued, signed and displayed at the unit",
        "Job Safety Analysis reviewed with the whole crew",
        "Job programme and pressure limits reviewed and understood",
        "Current revision of the CT procedures confirmed in the Hub"
      ]},
      { title: "People", items: [
        "Pre-job safety meeting held and attendance recorded",
        "Correct PPE worn by everyone on location",
        "H2S monitors issued and bump-tested where H2S may be present",
        "Stop Work Authority restated to every person on site"
      ]},
      { title: "Equipment", items: [
        "Injector head and gooseneck inspected, no visible damage",
        "BOP stack function-tested and the result recorded",
        "Treating lines pressure-tested to the programme value",
        "CT string inspection record reviewed, within fatigue limits"
      ]},
      { title: "Site", items: [
        "Exclusion zones barriered and signed",
        "Emergency muster point agreed and communicated",
        "Spill kit and fire extinguishers in place and in date"
      ]}
    ],
    signoff: ["Completed by", "Verified by (CT Supervisor)"]
  },

  "TQ-TDS-DSS-F001": {
    sample: true,
    jobFields: ["Rig / location", "Date", "Shift", "Meeting led by"],
    sections: [
      { title: "Attendance and review", items: [
        "All crew on shift present or accounted for",
        "Incidents and near misses from the last 24 hours discussed",
        "Open actions from yesterday's meeting reviewed"
      ]},
      { title: "Today's work", items: [
        "Planned operations explained, step by step",
        "Hazards and controls for each operation discussed",
        "Simultaneous operations (SIMOPS) identified and coordinated",
        "Weather and its effect on the work considered"
      ]},
      { title: "Readiness", items: [
        "Permits required today identified and requested",
        "Emergency roles confirmed for this shift",
        "Stop Work Authority restated"
      ]}
    ],
    signoff: ["Meeting led by", "Toolpusher"]
  },

  "TQ-TWS-WTS-F001": {
    sample: true,
    jobFields: ["Well / location", "Date", "Test programme", "Test supervisor"],
    sections: [
      { title: "Surface equipment", items: [
        "All surface equipment pressure-rated above the expected wellhead pressure",
        "Flowlines and connections pressure-tested and recorded",
        "Emergency shutdown (ESD) system function-tested",
        "Relief valves in date and set to the programme values"
      ]},
      { title: "Flare and sampling", items: [
        "Burner or flare area clear and wind direction checked",
        "Sampling points and procedures agreed with the client"
      ]},
      { title: "Safety", items: [
        "H2S contingency plan in place and briefed",
        "Communication with the rig floor and control room tested",
        "Muster point and escape routes communicated"
      ]}
    ],
    signoff: ["Completed by", "Verified by (Test Supervisor)"]
  },

  "TQ-MS-F001": {
    sample: true,
    jobFields: ["Vessel", "Port / location", "Date", "Master"],
    sections: [
      { title: "Vessel and crew", items: [
        "Vessel certificates valid for the planned operation",
        "Crew certificates and medicals in date",
        "Safety induction given to all TAQA personnel on board"
      ]},
      { title: "Deck and lifting", items: [
        "Deck load plan approved",
        "Lifting equipment certified and inspected",
        "Cargo sea-fastened and inspected"
      ]},
      { title: "Emergency readiness", items: [
        "Abandon ship and man overboard drills completed",
        "Communication plan with shore base confirmed"
      ]}
    ],
    signoff: ["Completed by", "Master"]
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = { TAQA_FORMS };
