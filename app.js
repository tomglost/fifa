// ─── CONFIG ──────────────────────────────────────────────────────────────────
// Fill these in after setting up Google Sheets (see SETUP.md)
const SHEET_ID     = "1NlmATTRWBf2BoAkxO9tTiShalagdRvX_Yq5t8M5VVew";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzspvWZlWgatbtiztq_iKCpTDrjZ4XCReadcV7wdZuIVXNHTWu8I9-mFXzvTYbwzhY/exec";

// ─── STATE ───────────────────────────────────────────────────────────────────
let results = {}; // { matchId: { home: N, away: N } }
let activeModal = null;

// ─── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  setupTabs();
  setupFilters();
  setupModal();
  await loadResults();
  render();
});

// ─── TABS ─────────────────────────────────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(s => s.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });
}

// ─── FILTERS ─────────────────────────────────────────────────────────────────
let activeFilter = "all";
function setupFilters() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      renderSchedule();
    });
  });
}

// ─── GOOGLE SHEETS LOAD ───────────────────────────────────────────────────────
async function loadResults() {
  if (SHEET_ID === "YOUR_SHEET_ID_HERE") {
    // Demo mode — no sheet configured yet
    return;
  }
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Results`;
    const res = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);/)[1]);
    const rows = json.table.rows;
    rows.forEach(row => {
      if (!row.c[0] || !row.c[0].v) return;
      const id   = row.c[0].v;
      const home = parseInt(row.c[1].v, 10);
      const away = parseInt(row.c[2].v, 10);
      if (!isNaN(home) && !isNaN(away)) {
        results[id] = { home, away };
      }
    });
  } catch (e) {
    console.warn("Could not load results from Google Sheets:", e);
  }
}

// ─── GOOGLE SHEETS SAVE ───────────────────────────────────────────────────────
async function saveResult(matchId, homeGoals, awayGoals) {
  if (APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") {
    // Demo mode — just save locally
    results[matchId] = { home: homeGoals, away: awayGoals };
    render();
    showToast("Result saved (demo mode — not persisted to sheet)");
    return;
  }
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, homeGoals, awayGoals }),
    });
    results[matchId] = { home: homeGoals, away: awayGoals };
    render();
    showToast("Result saved ✓");
  } catch (e) {
    showToast("Error saving result — check your connection", true);
  }
}

async function clearResult(matchId) {
  if (APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") {
    delete results[matchId];
    render();
    showToast("Result cleared (demo mode)");
    return;
  }
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, homeGoals: "", awayGoals: "", clear: true }),
    });
    delete results[matchId];
    render();
    showToast("Result cleared ✓");
  } catch (e) {
    showToast("Error clearing result", true);
  }
}

// ─── STANDINGS CALCULATION ────────────────────────────────────────────────────
function calcStandings(group) {
  const players = Object.values(PLAYERS).filter(p => p.group === group);
  const stats = {};
  players.forEach(p => {
    stats[p.id] = { id: p.id, name: p.name, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 };
  });

  GROUP_MATCHES.filter(m => m.group === group).forEach(m => {
    const r = results[m.id];
    if (!r) return;
    const h = stats[m.home], a = stats[m.away];
    h.P++; a.P++;
    h.GF += r.home; h.GA += r.away;
    a.GF += r.away; a.GA += r.home;
    h.GD = h.GF - h.GA;
    a.GD = a.GF - a.GA;
    if (r.home > r.away)      { h.W++; h.Pts += 3; a.L++; }
    else if (r.home < r.away) { a.W++; a.Pts += 3; h.L++; }
    else                       { h.D++; h.Pts++; a.D++; a.Pts++; }
  });

  return Object.values(stats).sort((a, b) =>
    b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF || a.name.localeCompare(b.name)
  );
}

// ─── KNOCKOUT RESOLVER ───────────────────────────────────────────────────────
function resolveKnockout() {
  const standingsA = calcStandings("A");
  const standingsB = calcStandings("B");

  const slots = {};
  ["A","B"].forEach(g => {
    const s = g === "A" ? standingsA : standingsB;
    [1,2,3,4].forEach((pos, i) => { slots[`${g}${pos}`] = s[i]; });
  });

  const knockoutResults = {};
  const winners = {};

  KNOCKOUT_TEMPLATE.forEach(match => {
    const home = match.homeSlot.startsWith("W:")
      ? winners[match.homeSlot.slice(2)] : slots[match.homeSlot];
    const away = match.awaySlot.startsWith("W:")
      ? winners[match.awaySlot.slice(2)] : slots[match.awaySlot];

    knockoutResults[match.id] = { ...match, home, away, result: results[match.id] };

    const r = results[match.id];
    if (r && home && away) {
      winners[match.id] = r.home > r.away ? home : r.away > r.home ? away : null;
    }
  });

  return knockoutResults;
}

// ─── RENDER ───────────────────────────────────────────────────────────────────
function render() {
  renderStandings();
  renderSchedule();
  renderBracket();
}

function renderStandings() {
  ["A","B"].forEach(group => {
    const tbody = document.getElementById(`standings-${group.toLowerCase()}`);
    const rows = calcStandings(group);
    tbody.innerHTML = rows.map((p, i) => {
      const qualified = i < 4;
      const eliminated = i === 4;
      return `
        <tr class="${qualified ? 'qualified' : ''} ${eliminated ? 'eliminated' : ''}">
          <td class="pos">${i + 1}</td>
          <td class="name">${p.name}${i === 0 ? ' <span class="badge">1st</span>' : ''}</td>
          <td>${p.P}</td>
          <td>${p.W}</td>
          <td>${p.D}</td>
          <td>${p.L}</td>
          <td>${p.GF}</td>
          <td>${p.GA}</td>
          <td class="${p.GD > 0 ? 'gd-pos' : p.GD < 0 ? 'gd-neg' : ''}">${p.GD > 0 ? '+' : ''}${p.GD}</td>
          <td class="pts">${p.Pts}</td>
        </tr>`;
    }).join("");
  });
}

function renderSchedule() {
  const list = document.getElementById("match-list");
  const filtered = GROUP_MATCHES.filter(m => {
    const played = !!results[m.id];
    if (activeFilter === "upcoming") return !played;
    if (activeFilter === "played")   return played;
    if (activeFilter === "A")        return m.group === "A";
    if (activeFilter === "B")        return m.group === "B";
    return true;
  });

  list.innerHTML = filtered.map(m => {
    const h = PLAYERS[m.home];
    const a = PLAYERS[m.away];
    const r = results[m.id];
    const played = !!r;
    return `
      <div class="match-card ${played ? 'played' : 'upcoming'} group-${m.group}" data-id="${m.id}">
        <div class="match-num">Match ${m.matchNum} · Group ${m.group}</div>
        <div class="match-row">
          <span class="player home ${r && r.home > r.away ? 'winner' : ''}">${h.name}</span>
          <div class="score-box">
            ${played
              ? `<span class="score">${r.home}</span><span class="score-sep">–</span><span class="score">${r.away}</span>`
              : `<span class="vs">VS</span>`}
          </div>
          <span class="player away ${r && r.away > r.home ? 'winner' : ''}">${a.name}</span>
        </div>
        <button class="enter-score-btn" data-id="${m.id}">
          ${played ? '✏️ Edit Score' : '+ Enter Score'}
        </button>
      </div>`;
  }).join("") || `<div class="empty-state">No matches to show.</div>`;

  list.querySelectorAll(".enter-score-btn").forEach(btn => {
    btn.addEventListener("click", () => openModal(btn.dataset.id, "group"));
  });
}

function renderBracket() {
  const allPlayed = GROUP_MATCHES.every(m => !!results[m.id]);
  const note = document.getElementById("bracket-note");
  const wrap = document.getElementById("bracket-wrap");

  const playedCount = GROUP_MATCHES.filter(m => !!results[m.id]).length;
  const remaining = GROUP_MATCHES.length - playedCount;

  if (!allPlayed && playedCount === 0) {
    note.textContent = "Bracket unlocks once the group stage is complete.";
    note.classList.remove("hidden");
    wrap.innerHTML = "";
    return;
  }

  if (!allPlayed) {
    note.textContent = `${remaining} group match${remaining !== 1 ? 'es' : ''} remaining before bracket is finalised.`;
    note.classList.remove("hidden");
  } else {
    note.classList.add("hidden");
  }

  const ko = resolveKnockout();
  const rounds = [
    { key: "QF", label: "QUARTER FINALS", matches: ["qf1","qf2","qf3","qf4"] },
    { key: "SF", label: "SEMI FINALS",    matches: ["sf1","sf2"] },
    { key: "F",  label: "FINAL",          matches: ["f1"] },
  ];

  wrap.innerHTML = `
    <div class="bracket">
      ${rounds.map(round => `
        <div class="bracket-round">
          <div class="round-label">${round.label}</div>
          <div class="round-matches">
            ${round.matches.map(id => {
              const m = ko[id];
              const r = results[id];
              const homeName = m.home ? m.home.name : "TBD";
              const awayName = m.away ? m.away.name : "TBD";
              const hasTeams = m.home && m.away;
              const played = !!r;
              return `
                <div class="bracket-match ${played ? 'played' : ''} ${hasTeams ? 'active' : 'pending'}">
                  <div class="bracket-label">${m.label}</div>
                  <div class="bracket-team ${played && r.home > r.away ? 'winner' : played && r.home < r.away ? 'loser' : ''}">
                    <span>${homeName}</span>
                    <span class="bracket-score">${played ? r.home : ''}</span>
                  </div>
                  <div class="bracket-team ${played && r.away > r.home ? 'winner' : played && r.away < r.home ? 'loser' : ''}">
                    <span>${awayName}</span>
                    <span class="bracket-score">${played ? r.away : ''}</span>
                  </div>
                  ${hasTeams ? `<button class="enter-score-btn small" data-id="${id}">
                    ${played ? '✏️ Edit' : '+ Score'}
                  </button>` : ''}
                </div>`;
            }).join("")}
          </div>
        </div>`).join("")}
      ${renderChampion(ko)}
    </div>`;

  // Winner banner
  wrap.querySelectorAll(".enter-score-btn").forEach(btn => {
    btn.addEventListener("click", () => openModal(btn.dataset.id, "knockout"));
  });
}

function renderChampion(ko) {
  const final = ko["f1"];
  const r = results["f1"];
  if (!r || !final.home || !final.away) return "";
  const champion = r.home > r.away ? final.home : r.away > r.home ? final.away : null;
  if (!champion) return "";
  return `
    <div class="champion-banner">
      <div class="champion-trophy">🏆</div>
      <div class="champion-label">CHAMPION</div>
      <div class="champion-name">${champion.name}</div>
    </div>`;
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function setupModal() {
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal").addEventListener("click", e => {
    if (e.target === document.getElementById("modal")) closeModal();
  });
  document.getElementById("modal-save").addEventListener("click", handleSave);
  document.getElementById("modal-clear").addEventListener("click", handleClear);
}

function openModal(matchId, type) {
  activeModal = { matchId, type };
  const m = type === "group"
    ? GROUP_MATCHES.find(x => x.id === matchId)
    : KNOCKOUT_TEMPLATE.find(x => x.id === matchId);

  const ko = type === "knockout" ? resolveKnockout() : null;
  const homeName = type === "group" ? PLAYERS[m.home].name : ko[matchId].home?.name || "TBD";
  const awayName = type === "group" ? PLAYERS[m.away].name : ko[matchId].away?.name || "TBD";

  document.getElementById("modal-p1").textContent = homeName;
  document.getElementById("modal-p2").textContent = awayName;
  document.getElementById("modal-match-label").textContent =
    type === "group" ? `Match ${m.matchNum} · Group ${m.group}` : m.label;

  const r = results[matchId];
  document.getElementById("score1").value = r ? r.home : "";
  document.getElementById("score2").value = r ? r.away : "";
  document.getElementById("modal-error").classList.add("hidden");

  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("score1").focus();
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
  activeModal = null;
}

async function handleSave() {
  const s1 = document.getElementById("score1").value;
  const s2 = document.getElementById("score2").value;
  const err = document.getElementById("modal-error");

  if (s1 === "" || s2 === "") {
    err.textContent = "Please enter both scores.";
    err.classList.remove("hidden");
    return;
  }
  const h = parseInt(s1, 10), a = parseInt(s2, 10);
  if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
    err.textContent = "Scores must be 0 or higher.";
    err.classList.remove("hidden");
    return;
  }
  err.classList.add("hidden");
  closeModal();
  await saveResult(activeModal.matchId, h, a);
}

async function handleClear() {
  if (!results[activeModal.matchId]) { closeModal(); return; }
  closeModal();
  await clearResult(activeModal.matchId);
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg, isError = false) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast ${isError ? "error" : ""}`;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 3000);
}
