"use strict";

/* Constants and state */
const DATA = {
  playersUrl: "data/players.json",
  captainsUrl: "data/captains.json",
  configUrl: "data/config.json"
};

const PLACEHOLDER_IMG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAACXBIWXMAAAsSAAALEgHS3X78AAAAGHRFWHRTb2Z0d2FyZQBwYWludC5uZXQgNC4xLjNqLr1bAAABWElEQVR4Xu3TMQEAIAzAsIQc0kKx7wCwHk7YREt22QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB8C+Qm4w8z6wAAu6q9mgAA0O4iBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkN8gBAAAkJ3g8eYAAK2zqJgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4B9W9gD0CBe0AAAAASUVORK5CYII=";

const STATE = {
  players: [],
  captains: [],
  config: { teamSize: 5, initialBudget: 10000 },
  currentIndex: 0
};

const UI = {
  playerPhoto: null,
  playerName: null,
  playerMeta: null,
  bidInput: null,
  playerIndex: null,
  captainDashboard: null,
  prevBtn: null,
  nextBtn: null,
  fullscreenBtn: null,
  exportJsonBtn: null,
  exportPdfBtn: null,
  playerPanel: null,
  toast: null,
  resetBtn: null
};

const STORAGE_KEY = "football-auction-state";

/* LocalStorage helpers */
function saveState() {
  try {
    const stateToSave = {
      players: STATE.players,
      captains: STATE.captains,
      config: STATE.config,
      currentIndex: STATE.currentIndex,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    console.log("✅ State auto-saved");
  } catch (err) {
    console.error("Failed to save state:", err);
    showToast("Failed to auto-save. Check console.", "error");
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      STATE.players = parsed.players || [];
      STATE.captains = parsed.captains || [];
      STATE.config = parsed.config || STATE.config;
      STATE.currentIndex = parsed.currentIndex || 0;
      console.log("✅ State loaded from localStorage");
      return true;
    }
  } catch (err) {
    console.error("Failed to load state:", err);
  }
  return false;
}

function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("🗑️ State cleared");
  } catch (err) {
    console.error("Failed to clear state:", err);
  }
}

function resetAuction() {
  if (confirm("Are you sure you want to reset the entire auction? This cannot be undone!")) {
    clearState();
    location.reload();
  }
}

/* Utilities */
const fmt = {
  money: n => Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 }),
  slug: s => String(s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
};

function showToast(message, variant = "info", ms = 1800) {
  if (!UI.toast) return;
  UI.toast.textContent = message;
  UI.toast.className = "toast show";
  if (variant === "error") UI.toast.style.borderColor = "rgba(239,68,68,0.6)";
  else if (variant === "success") UI.toast.style.borderColor = "rgba(34,197,94,0.6)";
  else UI.toast.style.borderColor = "rgba(255,255,255,0.12)";
  setTimeout(() => { UI.toast.classList.remove("show"); }, ms);
}

/* Data loading */
async function loadData() {
  try {
    const [pRes, cRes, cfgRes] = await Promise.all([
      fetch(DATA.playersUrl),
      fetch(DATA.captainsUrl),
      fetch(DATA.configUrl)
    ]);
    if (!pRes.ok || !cRes.ok || !cfgRes.ok) throw new Error("Failed to load one or more JSON files.");

    const p = await pRes.json();
    const c = await cRes.json();
    const cfg = await cfgRes.json();

    STATE.config = cfg || STATE.config;

    STATE.players = (p.players || []).map(pl => ({
      name: pl.name,
      position: pl.position,
      photo: pl.photo,
      rating: pl.rating,
      sold: false,
      soldPrice: null,
      awardedTo: null
    }));

    STATE.captains = (c.captains || []).map(cap => ({
      name: cap.name,
      teamName: cap.teamName,
      budget: STATE.config.initialBudget,
      initialBudget: STATE.config.initialBudget,
      roster: []
    }));

  } catch (err) {
    console.error(err);
    showToast("Error loading data. Use a local server.", "error", 4000);
    throw err;
  }
}

/* UI building and rendering */
function cacheDom() {
  UI.playerPhoto = document.getElementById("playerPhoto");
  UI.playerName = document.getElementById("playerName");
  UI.playerMeta = document.getElementById("playerMeta");
  UI.bidInput = document.getElementById("bidInput");
  UI.playerIndex = document.getElementById("playerIndex");
  UI.captainDashboard = document.getElementById("captainDashboard");
  UI.prevBtn = document.getElementById("prevBtn");
  UI.nextBtn = document.getElementById("nextBtn");
  UI.fullscreenBtn = document.getElementById("fullscreenBtn");
  UI.exportJsonBtn = document.getElementById("exportJsonBtn");
  UI.exportPdfBtn = document.getElementById("exportPdfBtn");
  UI.resetBtn = document.getElementById("resetBtn");
  UI.toast = document.getElementById("toast");
  UI.playerPanel = document.querySelector(".player-panel");
  UI.playerListSidebar = document.getElementById("playerListSidebar");
  UI.playerListContent = document.getElementById("playerListContent");
  UI.toggleSidebar = document.getElementById("toggleSidebar");
  UI.showSidebar = document.getElementById("showSidebar");
  UI.viewTeamsBtn = document.getElementById("viewTeamsBtn");
  UI.teamListModal = document.getElementById("teamListModal");
  UI.closeModal = document.getElementById("closeModal");
  UI.teamListBody = document.getElementById("teamListBody");
}

function buildCaptainCards() {
  UI.captainDashboard.innerHTML = "";
  STATE.captains.forEach((cap, idx) => {
    const card = document.createElement("div");
    const slug = fmt.slug(cap.name);
    card.className = `captain-card team-${slug}`;
    card.dataset.index = String(idx);

    const header = document.createElement("div");
    header.className = "captain-header";

    // Captain photo
    const photoDiv = document.createElement("div");
    photoDiv.className = "captain-photo-wrap";
    const photo = document.createElement("img");
    photo.className = "captain-photo";
    photo.src = `assets/${slug}.jpg`;
    photo.alt = cap.name;
    photo.onerror = () => {
      photo.onerror = null;
      photo.src = PLACEHOLDER_IMG;
    };
    photoDiv.appendChild(photo);

    // Team info
    const infoDiv = document.createElement("div");
    infoDiv.className = "captain-info";
    
    const teamEl = document.createElement("div");
    teamEl.className = "team-name";
    teamEl.textContent = cap.teamName;

    const capName = document.createElement("div");
    capName.className = "captain-name";
    capName.textContent = cap.name;

    infoDiv.appendChild(teamEl);
    infoDiv.appendChild(capName);
    
    header.appendChild(photoDiv);
    header.appendChild(infoDiv);

    const stats = document.createElement("div");
    stats.className = "captain-stats";

    const budgetLabel = document.createElement("div");
    budgetLabel.className = "stat-label";
    budgetLabel.textContent = "Remaining Budget";

    const budgetValue = document.createElement("div");
    budgetValue.className = "stat-value budget";
    budgetValue.id = `budget-${idx}`;

    const sizeLabel = document.createElement("div");
    sizeLabel.className = "stat-label";
    sizeLabel.textContent = "Team Size";

    const sizeValue = document.createElement("div");
    sizeValue.className = "stat-value";
    sizeValue.id = `teamsize-${idx}`;

    stats.appendChild(budgetLabel);
    stats.appendChild(budgetValue);
    stats.appendChild(sizeLabel);
    stats.appendChild(sizeValue);

    const awardBtn = document.createElement("button");
    awardBtn.className = "award-btn";
    awardBtn.textContent = `Award to ${cap.name}`;
    awardBtn.addEventListener("click", () => awardToCaptain(idx));

    card.appendChild(header);
    card.appendChild(stats);
    card.appendChild(awardBtn);

    UI.captainDashboard.appendChild(card);
  });
}

function renderPlayer() {
  const p = STATE.players[STATE.currentIndex];
  if (!p) return;

  UI.playerName.textContent = p.name;
  const soldBadge = p.sold ? "  •  SOLD" : "";
  UI.playerMeta.textContent = `${p.position}  •  Rating ${p.rating}${soldBadge}`;
  UI.playerPhoto.src = p.photo || "";
  UI.playerPhoto.onerror = () => {
    UI.playerPhoto.onerror = null;
    UI.playerPhoto.src = PLACEHOLDER_IMG;
  };

  UI.bidInput.value = p.soldPrice ? String(p.soldPrice) : "";

  UI.playerIndex.textContent = `Player ${STATE.currentIndex + 1} of ${STATE.players.length}`;

  const buttons = UI.captainDashboard.querySelectorAll(".award-btn");
  buttons.forEach(btn => btn.disabled = p.sold);
}

function renderCaptains() {
  STATE.captains.forEach((cap, idx) => {
    const budgetEl = document.getElementById(`budget-${idx}`);
    const sizeEl = document.getElementById(`teamsize-${idx}`);
    if (!budgetEl || !sizeEl) return;
    budgetEl.textContent = fmt.money(cap.budget);
    budgetEl.classList.remove("low", "critical");
    const ratio = cap.budget / cap.initialBudget;
    if (ratio <= 0.1) budgetEl.classList.add("critical");
    else if (ratio <= 0.2) budgetEl.classList.add("low");

    const size = 1 + cap.roster.length;
    sizeEl.textContent = `${size}/${STATE.config.teamSize}`;

    const card = budgetEl.closest(".captain-card");
    if (card) {
      card.classList.toggle("full", size >= STATE.config.teamSize);
    }
  });
}

function renderAll() {
  renderPlayer();
  renderCaptains();
  renderPlayerList();
}

/* Navigation */
function prevPlayer() {
  STATE.currentIndex = Math.max(0, STATE.currentIndex - 1);
  renderAll();
  saveState();
}

function nextPlayer() {
  STATE.currentIndex = Math.min(STATE.players.length - 1, STATE.currentIndex + 1);
  renderAll();
  saveState();
}

function nextUnsoldOrNext() {
  const n = STATE.players.length;
  for (let i = STATE.currentIndex + 1; i < n; i++) {
    if (!STATE.players[i].sold) {
      STATE.currentIndex = i;
      renderAll();
      saveState();
      return;
    }
  }
  if (STATE.currentIndex < n - 1) {
    nextPlayer();
  } else {
    showToast("Auction complete! 🎉", "success", 2200);
  }
}

/* Awarding workflow */
function awardToCaptain(captainIndex) {
  const captain = STATE.captains[captainIndex];
  const player = STATE.players[STATE.currentIndex];
  if (!captain || !player) return;

  if (player.sold) {
    showToast("Player already awarded.", "error");
    return;
  }

  const currentTeamSize = 1 + captain.roster.length;
  if (currentTeamSize >= STATE.config.teamSize) {
    showToast(`${captain.teamName} is full.`, "error");
    return;
  }

  const amount = Math.floor(Number(UI.bidInput.value || 0));
  if (!Number.isFinite(amount) || amount < 0) {
    showToast("Enter a valid non-negative bid amount.", "error");
    return;
  }

  if (amount > captain.budget) {
    showToast("Insufficient budget.", "error");
    return;
  }

  captain.budget -= amount;
  captain.roster.push({
    name: player.name,
    position: player.position,
    rating: player.rating,
    price: amount
  });
  player.sold = true;
  player.soldPrice = amount;
  player.awardedTo = captain.name;

  if (UI.playerPanel) {
    UI.playerPanel.classList.remove("awarded");
    void UI.playerPanel.offsetWidth;
    UI.playerPanel.classList.add("awarded");
  }
  const card = document.querySelector(`.captain-card.team-${fmt.slug(captain.name)}`);
  if (card) {
    card.classList.remove("flash");
    void card.offsetWidth;
    card.classList.add("flash");
  }

  renderAll();
  saveState(); // Auto-save after each award
  showToast(`Awarded ${player.name} to ${captain.teamName} for ${fmt.money(amount)}.`, "success", 1400);

  setTimeout(() => nextUnsoldOrNext(), 350);
}

/* Export functionality */
function exportTeamsJson() {
  const data = STATE.captains.map(c => ({
    captain: c.name,
    teamName: c.teamName,
    remainingBudget: c.budget,
    players: c.roster.map(r => ({
      name: r.name,
      position: r.position,
      rating: r.rating,
      price: r.price
    }))
  }));
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "teams.json";
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}

function exportTeamsPdf() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    showToast("jsPDF not loaded.", "error");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Football Auction - Final Teams", margin, y);
  y += 24;

  STATE.captains.forEach((c, i) => {
    if (y > pageH - margin - 100) {
      doc.addPage();
      y = margin;
    }

    doc.setDrawColor(200);
    doc.setLineWidth(1);
    doc.line(margin, y, pageW - margin, y);
    y += 14;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`${c.teamName}  (${c.name})`, margin, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Remaining Budget: ${fmt.money(c.budget)}`, margin, y);
    y += 14;

    if (c.roster.length === 0) {
      doc.text("Players: None", margin, y);
      y += 18;
      return;
    }

    doc.text("Players:", margin, y);
    y += 14;

    c.roster.forEach((p, idx) => {
      if (y > pageH - margin - 40) {
        doc.addPage();
        y = margin;
      }
      const line = `${idx + 1}. ${p.name}  •  ${p.position}  •  Rating ${p.rating}  •  ${fmt.money(p.price)}`;
      doc.text(line, margin + 12, y);
      y += 18;
    });

    y += 6;
  });

  doc.save("teams.pdf");
}

/* Fullscreen */
async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (e) {
    console.warn(e);
  }
}

/* Init */
async function init() {
  cacheDom();

  // Check if there's saved state
  const hasSavedState = loadState();
  
  if (hasSavedState) {
    const shouldRestore = confirm("Found saved auction data. Would you like to restore it?\n\nClick OK to restore, or Cancel to start fresh.");
    if (shouldRestore) {
      buildCaptainCards();
      renderAll();
      setupEventListeners();
      showToast("Auction data restored! 💾", "success", 2500);
      return;
    } else {
      clearState();
    }
  }

  // Load fresh data
  await loadData();
  buildCaptainCards();
  renderAll();
  saveState(); // Initial save
  setupEventListeners();
}

function setupEventListeners() {
  UI.prevBtn?.addEventListener("click", prevPlayer);
  UI.nextBtn?.addEventListener("click", nextPlayer);
  UI.fullscreenBtn?.addEventListener("click", toggleFullscreen);
  UI.exportJsonBtn?.addEventListener("click", exportTeamsJson);
  UI.exportPdfBtn?.addEventListener("click", exportTeamsPdf);
  UI.resetBtn?.addEventListener("click", resetAuction);
  UI.toggleSidebar?.addEventListener("click", toggleSidebarOpen);
  UI.showSidebar?.addEventListener("click", toggleSidebarOpen);
  UI.viewTeamsBtn?.addEventListener("click", showTeamListModal);
  UI.closeModal?.addEventListener("click", closeTeamListModal);
  
  // Close modal on outside click
  UI.teamListModal?.addEventListener("click", (e) => {
    if (e.target === UI.teamListModal) {
      closeTeamListModal();
    }
  });

  UI.bidInput?.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      let targetIndex = -1;
      let maxBudget = -1;
      STATE.captains.forEach((c, i) => {
        const size = 1 + c.roster.length;
        if (size < STATE.config.teamSize && c.budget > maxBudget) {
          maxBudget = c.budget;
          targetIndex = i;
        }
      });
      if (targetIndex >= 0) awardToCaptain(targetIndex);
    }
  });
}

/* Player List Sidebar */
function renderPlayerList() {
  if (!UI.playerListContent) return;
  
  const soldCount = STATE.players.filter(p => p.sold).length;
  const unsoldCount = STATE.players.length - soldCount;
  
  let html = `
    <div class="sidebar-stats">
      <div><span>Total Players:</span> <strong>${STATE.players.length}</strong></div>
      <div><span>Sold:</span> <strong style="color:var(--success)">${soldCount}</strong></div>
      <div><span>Remaining:</span> <strong style="color:var(--warn)">${unsoldCount}</strong></div>
    </div>
  `;
  
  STATE.players.forEach((player, idx) => {
    const statusClass = player.sold ? 'sold' : 'unsold';
    const statusText = player.sold ? `${player.awardedTo}` : 'Available';
    const priceText = player.sold ? ` • ${fmt.money(player.soldPrice)}` : '';
    
    html += `
      <div class="player-list-item ${statusClass}" data-player-index="${idx}">
        <div class="player-item-name">${player.name}</div>
        <div class="player-item-meta">
          <span>${player.position}${priceText}</span>
          <span class="player-item-status ${statusClass}">${statusText}</span>
        </div>
      </div>
    `;
  });
  
  UI.playerListContent.innerHTML = html;
  
  // Add click handlers
  document.querySelectorAll('.player-list-item').forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.playerIndex);
      STATE.currentIndex = index;
      renderAll();
      // Close sidebar on mobile
      if (window.innerWidth <= 700) {
        UI.playerListSidebar.classList.remove('open');
        UI.showSidebar.classList.remove('hidden');
      }
    });
  });
}

function toggleSidebarOpen() {
  if (UI.playerListSidebar) {
    UI.playerListSidebar.classList.toggle('open');
    UI.showSidebar.classList.toggle('hidden');
  }
}

/* Team List Modal */
function showTeamListModal() {
  if (!UI.teamListModal || !UI.teamListBody) return;
  
  let html = '<div class="team-grid">';
  
  STATE.captains.forEach(captain => {
    const slug = fmt.slug(captain.name);
    const teamSlug = fmt.slug(captain.teamName);
    const teamSize = 1 + captain.roster.length;
    const spent = captain.initialBudget - captain.budget;
    
    html += `
      <div class="team-card-full ${teamSlug}">
        <div class="team-card-header">
          <div class="team-card-photo">
            <img src="assets/${slug}.jpg" alt="${captain.name}" onerror="this.src='${PLACEHOLDER_IMG}'">
          </div>
          <div class="team-card-info">
            <h3>${captain.teamName}</h3>
            <div class="team-card-captain">Captain: ${captain.name}</div>
          </div>
        </div>
        
        <div class="team-stats">
          <div class="team-stat">
            <span class="team-stat-label">Team Size</span>
            <div class="team-stat-value">${teamSize}/${STATE.config.teamSize}</div>
          </div>
          <div class="team-stat">
            <span class="team-stat-label">Remaining</span>
            <div class="team-stat-value">${fmt.money(captain.budget)}</div>
          </div>
          <div class="team-stat">
            <span class="team-stat-label">Spent</span>
            <div class="team-stat-value">${fmt.money(spent)}</div>
          </div>
          <div class="team-stat">
            <span class="team-stat-label">Players</span>
            <div class="team-stat-value">${captain.roster.length}</div>
          </div>
        </div>
        
        <ul class="team-players-list">
          <li class="team-player-item" style="background:rgba(255,255,255,0.05);border-left:3px solid var(--accent);">
            <div>
              <div class="team-player-name">${captain.name} (C)</div>
            </div>
            <div class="team-player-meta">Captain</div>
          </li>
    `;
    
    if (captain.roster.length === 0) {
      html += '<div class="empty-team">No players acquired yet</div>';
    } else {
      captain.roster.forEach(player => {
        html += `
          <li class="team-player-item">
            <div>
              <div class="team-player-name">${player.name}</div>
              <div class="team-player-meta">${player.position}</div>
            </div>
            <div class="team-player-meta">${fmt.money(player.price)}</div>
          </li>
        `;
      });
    }
    
    html += `
        </ul>
      </div>
    `;
  });
  
  html += '</div>';
  UI.teamListBody.innerHTML = html;
  UI.teamListModal.classList.add('open');
}

function closeTeamListModal() {
  if (UI.teamListModal) {
    UI.teamListModal.classList.remove('open');
  }
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && UI.teamListModal?.classList.contains('open')) {
    closeTeamListModal();
  }
});

document.addEventListener("DOMContentLoaded", init);
