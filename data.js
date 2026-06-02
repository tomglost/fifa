// ─── PLAYERS ────────────────────────────────────────────────────────────────
const PLAYERS = {
  1:  { id: 1,  name: "Seb La Hei",      group: "A", seed: 1  },
  2:  { id: 2,  name: "Alec Sellston",   group: "B", seed: 2  },
  3:  { id: 3,  name: "Cameron Grigg",   group: "B", seed: 3  },
  4:  { id: 4,  name: "Jack Webb",       group: "A", seed: 4  },
  5:  { id: 5,  name: "Will Haseler",    group: "A", seed: 5  },
  6:  { id: 6,  name: "Jeffrey Warren",  group: "B", seed: 6  },
  7:  { id: 7,  name: "Tom Gloster",     group: "B", seed: 7  },
  8:  { id: 8,  name: "Rory Cope",       group: "A", seed: 8  },
  9:  { id: 9,  name: "George Verco",    group: "A", seed: 9  },
  10: { id: 10, name: "Marco Mclaren",   group: "B", seed: 10 },
  11: { id: 11, name: "Renee",           group: "B", seed: 11 },
};

// ─── GROUP STAGE MATCHES (interleaved schedule) ─────────────────────────────
// home, away are player IDs. group = "A" or "B". matchNum = display order.
const GROUP_MATCHES = [
  { id: "g1",  matchNum: 1,  group: "A", home: 1,  away: 4  },
  { id: "g2",  matchNum: 2,  group: "B", home: 2,  away: 3  },
  { id: "g3",  matchNum: 3,  group: "A", home: 5,  away: 8  },
  { id: "g4",  matchNum: 4,  group: "B", home: 6,  away: 7  },
  { id: "g5",  matchNum: 5,  group: "A", home: 9,  away: 1  },
  { id: "g6",  matchNum: 6,  group: "B", home: 10, away: 2  },
  { id: "g7",  matchNum: 7,  group: "A", home: 4,  away: 5  },
  { id: "g8",  matchNum: 8,  group: "B", home: 3,  away: 6  },
  { id: "g9",  matchNum: 9,  group: "A", home: 8,  away: 9  },
  { id: "g10", matchNum: 10, group: "B", home: 7,  away: 10 },
  { id: "g11", matchNum: 11, group: "A", home: 1,  away: 5  },
  { id: "g12", matchNum: 12, group: "B", home: 2,  away: 6  },
  { id: "g13", matchNum: 13, group: "A", home: 9,  away: 4  },
  { id: "g14", matchNum: 14, group: "B", home: 10, away: 3  },
  { id: "g15", matchNum: 15, group: "A", home: 8,  away: 1  },
  { id: "g16", matchNum: 16, group: "B", home: 7,  away: 2  },
  { id: "g17", matchNum: 17, group: "A", home: 5,  away: 9  },
  { id: "g18", matchNum: 18, group: "B", home: 6,  away: 10 },
  { id: "g19", matchNum: 19, group: "A", home: 4,  away: 8  },
  { id: "g20", matchNum: 20, group: "B", home: 3,  away: 7  },
  { id: "g21", matchNum: 21, group: "B", home: 2,  away: 11 },
  { id: "g22", matchNum: 22, group: "B", home: 11, away: 3  },
  { id: "g23", matchNum: 23, group: "B", home: 6,  away: 11 },
  { id: "g24", matchNum: 24, group: "B", home: 11, away: 7  },
  { id: "g25", matchNum: 25, group: "B", home: 10, away: 11 },
  { id: "g26", matchNum: 26, group: "B", home: 11, away: 2  },
  { id: "g27", matchNum: 27, group: "B", home: 3,  away: 11 },
  { id: "g28", matchNum: 28, group: "B", home: 11, away: 6  },
  { id: "g29", matchNum: 29, group: "B", home: 7,  away: 11 },
  { id: "g30", matchNum: 30, group: "B", home: 11, away: 10 },
];

// ─── KNOCKOUT TEMPLATE ──────────────────────────────────────────────────────
// Seeding: QF1 = A1 vs B4, QF2 = B1 vs A4, QF3 = A2 vs B3, QF4 = B2 vs A3
// SF1 = QF1w vs QF2w, SF2 = QF3w vs QF4w, Final = SF1w vs SF2w
const KNOCKOUT_TEMPLATE = [
  { id: "qf1", round: "QF", label: "QF 1", homeSlot: "A1", awaySlot: "B4" },
  { id: "qf2", round: "QF", label: "QF 2", homeSlot: "B1", awaySlot: "A4" },
  { id: "qf3", round: "QF", label: "QF 3", homeSlot: "A2", awaySlot: "B3" },
  { id: "qf4", round: "QF", label: "QF 4", homeSlot: "B2", awaySlot: "A3" },
  { id: "sf1", round: "SF", label: "SF 1", homeSlot: "W:qf1", awaySlot: "W:qf2" },
  { id: "sf2", round: "SF", label: "SF 2", homeSlot: "W:qf3", awaySlot: "W:qf4" },
  { id: "f1",  round: "F",  label: "FINAL", homeSlot: "W:sf1", awaySlot: "W:sf2" },
];
