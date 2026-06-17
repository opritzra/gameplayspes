const TEAM_HOME = "Atl\u00e9tico Itarar\u00e9";
const TEAM_AWAY = "Kawasaki Joinville";
const createMatchBtn = document.getElementById("createMatchBtn");
const homeTeamPicker = document.getElementById("homeTeamPicker");
const addEventBtn = document.getElementById("addEventBtn");
const continueMatchBtn = document.getElementById("continueMatchBtn");
const finishMatchBtn = document.getElementById("finishMatchBtn");
const matchStatus = document.getElementById("matchStatus");
const homeScore = document.getElementById("homeScore");
const awayScore = document.getElementById("awayScore");
const homeTeamName = document.getElementById("homeTeamName");
const awayTeamName = document.getElementById("awayTeamName");
const homeCrest = document.getElementById("homeCrest");
const awayCrest = document.getElementById("awayCrest");
const currentMinute = document.getElementById("currentMinute");
const matchControls = document.getElementById("matchControls");
const eventsList = document.getElementById("eventsList");
const historyList = document.getElementById("historyList");
const historyPagination = document.getElementById("historyPagination");
const prevHistoryBtn = document.getElementById("prevHistoryBtn");
const nextHistoryBtn = document.getElementById("nextHistoryBtn");
const historyPageInfo = document.getElementById("historyPageInfo");
const homeForm = document.getElementById("homeForm");
const awayForm = document.getElementById("awayForm");
const homeChance = document.getElementById("homeChance");
const awayChance = document.getElementById("awayChance");
const downloadTokenBtn = document.getElementById("downloadTokenBtn");
const uploadTokenBtn = document.getElementById("uploadTokenBtn");
const uploadTokenInput = document.getElementById("uploadTokenInput");
const toggleStatsBtn = document.getElementById("toggleStatsBtn");
const toggleScorersBtn = document.getElementById("toggleScorersBtn");
const toggleCardsBtn = document.getElementById("toggleCardsBtn");
const statsChevron = document.getElementById("statsChevron");
const scorersChevron = document.getElementById("scorersChevron");
const cardsChevron = document.getElementById("cardsChevron");
const overallStats = document.getElementById("overallStats");
const topScorersList = document.getElementById("topScorersList");
const topCardsList = document.getElementById("topCardsList");
const totalMatchesStat = document.getElementById("totalMatchesStat");
const homeWinsStat = document.getElementById("homeWinsStat");
const awayWinsStat = document.getElementById("awayWinsStat");
const homeRateStat = document.getElementById("homeRateStat");
const awayRateStat = document.getElementById("awayRateStat");
const homeGoalsStat = document.getElementById("homeGoalsStat");
const awayGoalsStat = document.getElementById("awayGoalsStat");
const penaltyControls = document.getElementById("penaltyControls");

const teamSelect = document.getElementById("teamSelect");
const eventType = document.getElementById("eventType");
const playerName = document.getElementById("playerName");
const playerSuggestions = document.getElementById("playerSuggestions");
const eventMinute = document.getElementById("eventMinute");
const homePenaltyScore = document.getElementById("homePenaltyScore");
const awayPenaltyScore = document.getElementById("awayPenaltyScore");
const STORAGE_KEY = "elgamepreidepes-history";

let activeMatch = null;
const persistedState = loadAppState();
let history = persistedState.history;
let scorerOverrides = persistedState.scorerOverrides;
let selectedHomeTeam = TEAM_HOME;
let statsOpen = false;
let scorersOpen = false;
let cardsOpen = false;
let historyPage = 1;
const HISTORY_PAGE_SIZE = 5;

const eventLabels = {
  goal: "Gol",
  yellow: "Cart\u00e3o amarelo",
  red: "Cart\u00e3o vermelho",
  missedPenalty: "P\u00eanalti perdido",
};

const crestMap = {
  [TEAM_HOME]: {
    src: "https://upload.wikimedia.org/wikipedia/pt/b/b4/Corinthians_simbolo.png",
    alt: "Escudo do Atletico Itarare",
  },
  [TEAM_AWAY]: {
    src: "https://www.frontale.co.jp/common_2017/emblems/kf_emblem.png",
    alt: "Escudo do Kawasaki Joinville",
  },
};

const teamCodeMap = {
  [TEAM_HOME]: "A",
  [TEAM_AWAY]: "K",
};

const teamFromCodeMap = {
  A: TEAM_HOME,
  K: TEAM_AWAY,
};

const eventTypeCodeMap = {
  goal: "g",
  yellow: "y",
  red: "r",
  missedPenalty: "p",
};

const eventTypeFromCodeMap = {
  g: "goal",
  y: "yellow",
  r: "red",
  p: "missedPenalty",
};

const phaseCodeMap = {
  regulation: "r",
  overtime: "o",
  penalties: "p",
};

const phaseFromCodeMap = {
  r: "regulation",
  o: "overtime",
  p: "penalties",
};

createMatchBtn.addEventListener("click", startMatch);
homeTeamPicker.addEventListener("change", handleHomeTeamChange);
addEventBtn.addEventListener("click", addEvent);
continueMatchBtn.addEventListener("click", continueMatch);
finishMatchBtn.addEventListener("click", finishMatch);
toggleStatsBtn.addEventListener("click", toggleStats);
toggleScorersBtn.addEventListener("click", toggleScorers);
toggleCardsBtn.addEventListener("click", toggleCards);
prevHistoryBtn.addEventListener("click", () => changeHistoryPage(-1));
nextHistoryBtn.addEventListener("click", () => changeHistoryPage(1));
downloadTokenBtn.addEventListener("click", downloadHistoryToken);
uploadTokenBtn.addEventListener("click", () => uploadTokenInput.click());
uploadTokenInput.addEventListener("change", importHistoryTokenFromFile);
playerName.addEventListener("input", handlePlayerInput);
playerName.addEventListener("focus", handlePlayerInput);
playerName.addEventListener("keydown", handlePlayerSuggestionKeydown);
document.addEventListener("click", handleDocumentClick);

renderHistory();
renderForms();
renderChances();
renderOverallStats();
renderTopScorers();
renderTopCards();
renderPlayerSuggestions();
renderActiveMatch();

function startMatch() {
  const homeTeam = selectedHomeTeam;
  const awayTeam = getOpponentTeam(homeTeam);

  activeMatch = {
    startedAt: new Date().toISOString(),
    homeTeam,
    awayTeam,
    score: {
      [TEAM_HOME]: 0,
      [TEAM_AWAY]: 0,
    },
    penalties: {
      [TEAM_HOME]: 0,
      [TEAM_AWAY]: 0,
    },
    events: [],
    phase: "regulation",
    status: "live",
  };

  playerName.value = "";
  eventMinute.value = "";
  eventMinute.min = "1";
  eventMinute.max = "90";
  teamSelect.value = TEAM_HOME;
  eventType.value = "goal";
  homePenaltyScore.value = "";
  awayPenaltyScore.value = "";
  renderActiveMatch();
}

function handleHomeTeamChange() {
  if (activeMatch) {
    homeTeamPicker.value = activeMatch.homeTeam;
    return;
  }

  selectedHomeTeam = homeTeamPicker.value;
  renderActiveMatch();
}

function addEvent() {
  if (!activeMatch) return;

  const team = teamSelect.value;
  const type = eventType.value;
  const player = getCanonicalPlayerName(playerName.value);
  const minute = Number(eventMinute.value);
  const minuteRange = getMinuteRange(activeMatch.phase);

  if (activeMatch.phase === "penalties") {
    applyPenaltyScore();
    return;
  }

  if (!player) {
    alert("Informe o nome do jogador.");
    return;
  }

  if (!Number.isFinite(minute) || minute < minuteRange.min || minute > minuteRange.max) {
    alert(`Informe uma minutagem valida entre ${minuteRange.min} e ${minuteRange.max}.`);
    return;
  }

  const event = { team, type, player, minute, phase: activeMatch.phase };
  activeMatch.events.push(event);
  activeMatch.events.sort((a, b) => a.minute - b.minute);

  if (activeMatch.phase === "penalties" && type === "goal") {
    activeMatch.penalties[team] += 1;
  } else if (type === "goal") {
    activeMatch.score[team] += 1;
  }

  playerName.value = "";
  hidePlayerSuggestions();
  eventMinute.value = "";
  renderActiveMatch();
}

async function finishMatch() {
  if (!activeMatch) return;

  try {
    if (activeMatch.phase === "penalties") {
      if (!applyPenaltyScore()) {
        return;
      }

      if (activeMatch.penalties[TEAM_HOME] === activeMatch.penalties[TEAM_AWAY]) {
        alert("Os penaltis nao podem terminar empatados.");
        return;
      }

      await persistFinishedMatch();
      return;
    }

    if (getMatchResult(activeMatch) === "draw") {
      if (activeMatch.phase === "regulation") {
        activeMatch.status = "awaitingOvertime";
        renderActiveMatch();
        return;
      }

      if (activeMatch.phase === "overtime") {
        activeMatch.status = "awaitingPenalties";
        renderActiveMatch();
        return;
      }
    }

    await persistFinishedMatch();
  } catch (error) {
    console.error(error);
    alert(getErrorMessage(error, "Nao foi possivel salvar a partida no historico local."));
  }
}

function continueMatch() {
  if (!activeMatch) return;

  if (activeMatch.status === "awaitingOvertime") {
    activeMatch.phase = "overtime";
    activeMatch.status = "live";
    eventMinute.min = "91";
    eventMinute.max = "120";
    renderActiveMatch();
    return;
  }

  if (activeMatch.status === "awaitingPenalties") {
    activeMatch.phase = "penalties";
    activeMatch.status = "live";
    homePenaltyScore.value = String(activeMatch.penalties[TEAM_HOME] || "");
    awayPenaltyScore.value = String(activeMatch.penalties[TEAM_AWAY] || "");
    renderActiveMatch();
  }
}

async function persistFinishedMatch() {
  const finishedMatch = {
    ...activeMatch,
    endedAt: new Date().toISOString(),
    result: getMatchResult(activeMatch),
  };

  history.unshift(finishedMatch);
  historyPage = 1;
  saveAppState();

  activeMatch = null;
  renderActiveMatch();
  renderHistory();
  renderForms();
  renderChances();
  renderOverallStats();
  renderTopScorers();
  renderTopCards();
  renderPlayerSuggestions();
}

function getMatchResult(match) {
  if (match.phase === "penalties") {
    if (match.penalties[TEAM_HOME] > match.penalties[TEAM_AWAY]) return TEAM_HOME;
    if (match.penalties[TEAM_AWAY] > match.penalties[TEAM_HOME]) return TEAM_AWAY;
  }

  const homeGoals = match.score[TEAM_HOME];
  const awayGoals = match.score[TEAM_AWAY];

  if (homeGoals > awayGoals) return TEAM_HOME;
  if (awayGoals > homeGoals) return TEAM_AWAY;
  return "draw";
}

function renderActiveMatch() {
  const displayedTeams = getDisplayedTeams();

  if (!activeMatch) {
    matchStatus.textContent = "Aguardando inicio";
    matchStatus.className = "status-badge idle";
    renderDisplayedTeams(displayedTeams.homeTeam, displayedTeams.awayTeam);
    homeScore.textContent = "0";
    awayScore.textContent = "0";
    currentMinute.textContent = "--";
    matchControls.classList.add("disabled");
    continueMatchBtn.classList.add("hidden");
    penaltyControls.classList.add("hidden");
    eventMinute.min = "1";
    eventMinute.max = "90";
    eventsList.className = "events-list empty-state";
    eventsList.innerHTML = "<li>Nenhuma partida em andamento.</li>";
    return;
  }

  renderDisplayedTeams(displayedTeams.homeTeam, displayedTeams.awayTeam);
  matchStatus.textContent = getStatusLabel(activeMatch);
  matchStatus.className = "status-badge live";
  homeScore.textContent = formatScoreDisplay(activeMatch, displayedTeams.homeTeam);
  awayScore.textContent = formatScoreDisplay(activeMatch, displayedTeams.awayTeam);
  currentMinute.textContent = formatMinute(getCurrentMinute(activeMatch), activeMatch.phase);
  updateEventTypeOptions();
  syncMinuteRange(activeMatch.phase);
  togglePenaltyMode(activeMatch.phase === "penalties");

  const canEditEvents = activeMatch.status === "live";
  matchControls.classList.toggle("disabled", !canEditEvents);
  continueMatchBtn.classList.toggle("hidden", canEditEvents);
  continueMatchBtn.textContent = activeMatch.status === "awaitingPenalties" ? "Iniciar penaltis" : "Continuar jogo";

  if (activeMatch.events.length === 0) {
    eventsList.className = "events-list empty-state";
    eventsList.innerHTML = `<li>${getEmptyEventLabel(activeMatch)}</li>`;
    return;
  }

  eventsList.className = "events-list";
  eventsList.innerHTML = activeMatch.events
    .map((event) => {
      return `
        <li class="event-item">
          <div class="event-top">
            <span class="event-badge ${event.type}">${eventLabels[event.type]}</span>
            <span class="minute-chip">${formatMinute(event.minute, event.phase)}</span>
          </div>
          <div class="event-body">
            <strong>${event.team}</strong> - ${formatPlayerName(event.player)} (${getPhaseLabel(event.phase)})
          </div>
        </li>
      `;
    })
    .join("");
}

function renderHistory() {
  const paginatedHistory = getPaginatedHistory();
  const totalPages = getHistoryTotalPages();

  if (history.length === 0) {
    historyList.className = "history-list empty-state";
    historyList.innerHTML = "<li>Nenhuma partida finalizada ainda.</li>";
    historyPagination.classList.add("hidden");
    return;
  }

  historyList.className = "history-list";
  historyList.innerHTML = paginatedHistory
    .map((match) => {
      const matchIndex = history.findIndex((item) => item.endedAt === match.endedAt && item.startedAt === match.startedAt);
      const homeGoals = match.score[match.homeTeam];
      const awayGoals = match.score[match.awayTeam];

      return `
        <li class="history-item">
          <div class="history-top">
            <strong>${formatHistoryScore(match, homeGoals, awayGoals, match.homeTeam, match.awayTeam)}</strong>
            <span class="result-chip ${resultClass(match.result)}">${resultLabel(match.result)}</span>
          </div>
          <div class="history-body">
            ${describeDate(match.endedAt)} - ${getPhaseLabel(match.phase)}<br>
            Atl&eacute;tico Itarar&eacute;: ${getTeamOutcome(match, TEAM_HOME)} | Kawasaki Joinville: ${getTeamOutcome(match, TEAM_AWAY)}
          </div>
          <div class="history-actions">
            <button class="history-delete" type="button" data-history-index="${matchIndex}">Excluir partida</button>
          </div>
        </li>
      `;
    })
    .join("");

  historyPagination.classList.toggle("hidden", totalPages <= 1);
  historyPageInfo.textContent = `Pagina ${historyPage} de ${totalPages}`;
  prevHistoryBtn.disabled = historyPage <= 1;
  nextHistoryBtn.disabled = historyPage >= totalPages;

  historyList.querySelectorAll(".history-delete").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.historyIndex);
      deleteHistoryMatch(index);
    });
  });
}

function renderForms() {
  const displayedTeams = getDisplayedTeams();
  const recentHistory = getRecentHistory();
  const homeRecent = recentHistory.map((match) => getTeamOutcome(match, displayedTeams.homeTeam));
  const awayRecent = recentHistory.map((match) => getTeamOutcome(match, displayedTeams.awayTeam));

  homeForm.innerHTML = formatFormTrack(homeRecent);
  awayForm.innerHTML = formatFormTrack(awayRecent);
}

function renderChances() {
  const chances = calculateWinChances();
  const displayedTeams = getDisplayedTeams();
  homeChance.textContent = `Chance de vitoria: ${chances[displayedTeams.homeTeam]}%`;
  awayChance.textContent = `Chance de vitoria: ${chances[displayedTeams.awayTeam]}%`;
}

function renderOverallStats() {
  const totalMatches = history.length;
  const homeWins = history.filter((match) => match.result === TEAM_HOME).length;
  const awayWins = history.filter((match) => match.result === TEAM_AWAY).length;
  const homeGoals = history.reduce((sum, match) => sum + (match.score?.[TEAM_HOME] || 0), 0);
  const awayGoals = history.reduce((sum, match) => sum + (match.score?.[TEAM_AWAY] || 0), 0);

  totalMatchesStat.textContent = String(totalMatches);
  homeWinsStat.textContent = String(homeWins);
  awayWinsStat.textContent = String(awayWins);
  homeRateStat.textContent = `Taxa de vitoria: ${calculateRate(homeWins, totalMatches)}%`;
  awayRateStat.textContent = `Taxa de vitoria: ${calculateRate(awayWins, totalMatches)}%`;
  homeGoalsStat.textContent = `Gols marcados: ${homeGoals}`;
  awayGoalsStat.textContent = `Gols marcados: ${awayGoals}`;
}

function toggleStats() {
  statsOpen = !statsOpen;
  overallStats.classList.toggle("hidden", !statsOpen);
  toggleStatsBtn.setAttribute("aria-expanded", String(statsOpen));
  statsChevron.textContent = statsOpen ? "-" : "+";
}

function toggleScorers() {
  scorersOpen = !scorersOpen;
  topScorersList.classList.toggle("hidden", !scorersOpen);
  toggleScorersBtn.setAttribute("aria-expanded", String(scorersOpen));
  scorersChevron.textContent = scorersOpen ? "-" : "+";
}

function toggleCards() {
  cardsOpen = !cardsOpen;
  topCardsList.classList.toggle("hidden", !cardsOpen);
  toggleCardsBtn.setAttribute("aria-expanded", String(cardsOpen));
  cardsChevron.textContent = cardsOpen ? "-" : "+";
}

function getTeamOutcome(match, team) {
  if (match.result === "draw") return "E";
  return match.result === team ? "V" : "D";
}

function formatFormTrack(results) {
  if (results.length === 0) {
    return "Ultimas 5: sem partidas";
  }

  return `<span class="form-track">${results
    .map((result) => `<span class="form-badge ${formBadgeClass(result)}">${result === "D" ? "X" : result}</span>`)
    .join("")}</span>`;
}

function formBadgeClass(result) {
  if (result === "V") return "win";
  if (result === "D") return "loss";
  return "draw";
}

function resultLabel(result) {
  if (result === TEAM_HOME) return "Vitoria Atletico";
  if (result === TEAM_AWAY) return "Vitoria Kawasaki";
  return "Empate";
}

function resultClass(result) {
  if (result === "draw") return "draw";
  return "win";
}

function calculateWinChances() {
  const recentHistory = getRecentHistory();

  if (recentHistory.length === 0) {
    return {
      [TEAM_HOME]: 50,
      [TEAM_AWAY]: 50,
    };
  }

  let homeStrength = 0;
  let awayStrength = 0;

  for (const match of recentHistory) {
    homeStrength += getMatchStrength(match, TEAM_HOME);
    awayStrength += getMatchStrength(match, TEAM_AWAY);
  }

  const total = homeStrength + awayStrength;
  if (total === 0) {
    return {
      [TEAM_HOME]: 50,
      [TEAM_AWAY]: 50,
    };
  }

  const home = Math.round((homeStrength / total) * 100);
  return {
    [TEAM_HOME]: home,
    [TEAM_AWAY]: 100 - home,
  };
}

function getMatchStrength(match, team) {
  const teamGoals = match.score[team];
  const opponent = team === TEAM_HOME ? TEAM_AWAY : TEAM_HOME;
  const opponentGoals = match.score[opponent];
  const goalDiff = teamGoals - opponentGoals;
  const absoluteDiff = Math.abs(goalDiff);
  const penaltiesApplied = hasPenaltyResult(match);
  const teamPenalties = match.penalties?.[team] || 0;
  const opponentPenalties = match.penalties?.[opponent] || 0;
  const penaltyDiff = teamPenalties - opponentPenalties;

  let strength = 1;

  if (goalDiff > 0) {
    strength += 1.8;
    strength += Math.min(absoluteDiff * 0.45, 1.8);
  } else if (goalDiff === 0) {
    strength += 0.8;
  } else {
    strength += 0.15;
    strength -= Math.min(absoluteDiff * 0.2, 0.6);
  }

  strength += Math.min(teamGoals * 0.12, 0.6);

  if (penaltiesApplied) {
    if (penaltyDiff > 0) {
      strength += 0.75;
      strength += Math.min(penaltyDiff * 0.08, 0.3);
    } else if (penaltyDiff < 0) {
      strength += 0.25;
    } else {
      strength += 0.4;
    }
  }

  return Math.max(strength, 0.2);
}

function calculateRate(wins, total) {
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
}

function renderTopScorers() {
  const scorers = buildScorersRanking();
  if (scorers.length === 0) {
    topScorersList.innerHTML = `<div class="ranking-item"><span class="ranking-meta">Nenhum gol registrado ainda.</span></div>`;
    return;
  }

  topScorersList.innerHTML = scorers
    .map((player, index) => `
      <div class="ranking-item">
        <div class="ranking-main">
          <img class="ranking-crest" src="${crestMap[player.team].src}" alt="${crestMap[player.team].alt}">
          <div>
            <button
              class="ranking-name-button"
              type="button"
              data-player-name="${escapeHtml(player.name)}"
              data-player-team="${escapeHtml(player.team)}"
              data-player-goals="${player.goals}"
            >
              <span class="ranking-name">${index + 1}. ${player.name}</span>
            </button>
            <div class="ranking-meta">${player.team}</div>
          </div>
        </div>
        <div class="ranking-value">${player.goals} gols</div>
      </div>
    `)
    .join("");

  topScorersList.querySelectorAll(".ranking-name-button").forEach((button) => {
    button.addEventListener("click", () => {
      editScorerGoals(
        button.dataset.playerName || "",
        button.dataset.playerTeam || "",
        Number(button.dataset.playerGoals) || 0
      );
    });
  });
}

function renderTopCards() {
  const players = buildCardsRanking();
  if (players.length === 0) {
    topCardsList.innerHTML = `<div class="ranking-item"><span class="ranking-meta">Nenhum cartao registrado ainda.</span></div>`;
    return;
  }

  topCardsList.innerHTML = players
    .map((player, index) => `
      <div class="ranking-item">
        <div class="ranking-main">
          <img class="ranking-crest" src="${crestMap[player.team].src}" alt="${crestMap[player.team].alt}">
          <div>
            <div class="ranking-name">${index + 1}. ${player.name}</div>
            <div class="ranking-meta">${player.team}</div>
          </div>
        </div>
        <div class="ranking-value">${player.total} cartoes</div>
      </div>
    `)
    .join("");
}

function buildScorersRanking() {
  const scorers = new Map();

  history.forEach((match) => {
    (match.events || []).forEach((event) => {
      if (event.type !== "goal") return;
      const playerDisplayName = getCanonicalPlayerName(event.player);
      const key = `${normalizePlayerName(event.player)}::${event.team}`;
      const current = scorers.get(key) || { name: playerDisplayName, team: event.team, goals: 0 };
      current.goals += 1;
      scorers.set(key, current);
    });
  });

  Object.entries(scorerOverrides).forEach(([key, goals]) => {
    const current = scorers.get(key);
    if (!current) {
      return;
    }

    if (Number(goals) < 0) {
      scorers.delete(key);
      return;
    }

    current.goals = Number(goals) || 0;
    scorers.set(key, current);
  });

  return [...scorers.values()]
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
    .slice(0, 10);
}

function buildCardsRanking() {
  const cards = new Map();

  history.forEach((match) => {
    (match.events || []).forEach((event) => {
      if (event.type !== "yellow" && event.type !== "red") return;
      const playerDisplayName = getCanonicalPlayerName(event.player);
      const key = `${normalizePlayerName(event.player)}::${event.team}`;
      const current = cards.get(key) || { name: playerDisplayName, team: event.team, total: 0, red: 0 };
      current.total += 1;
      if (event.type === "red") current.red += 1;
      cards.set(key, current);
    });
  });

  return [...cards.values()]
    .sort((a, b) => b.total - a.total || b.red - a.red || a.name.localeCompare(b.name))
    .slice(0, 10);
}

function getHistoryTotalPages() {
  return Math.max(1, Math.ceil(history.length / HISTORY_PAGE_SIZE));
}

function getPaginatedHistory() {
  const start = (historyPage - 1) * HISTORY_PAGE_SIZE;
  return history.slice(start, start + HISTORY_PAGE_SIZE);
}

function changeHistoryPage(direction) {
  const nextPage = historyPage + direction;
  const totalPages = getHistoryTotalPages();

  if (nextPage < 1 || nextPage > totalPages) {
    return;
  }

  historyPage = nextPage;
  renderHistory();
}

async function deleteHistoryMatch(index) {
  if (!Number.isInteger(index) || index < 0 || index >= history.length) {
    return;
  }

  const confirmed = window.confirm("Tem certeza que deseja excluir esta partida?");
  if (!confirmed) {
    return;
  }

  try {
    history.splice(index, 1);
    const totalPages = getHistoryTotalPages();
    if (historyPage > totalPages) {
      historyPage = totalPages;
    }

    saveAppState();
    renderHistory();
    renderForms();
    renderChances();
    renderOverallStats();
    renderTopScorers();
    renderTopCards();
    renderPlayerSuggestions();
    renderActiveMatch();
  } catch (error) {
    console.error(error);
    alert(getErrorMessage(error, "Nao foi possivel excluir a partida do historico local."));
  }
}

function getCurrentMinute(match) {
  if (match.events.length === 0) return "00";
  return String(Math.max(...match.events.map((event) => event.minute))).padStart(2, "0");
}

function formatMinute(minute) {
  if (minute === "00") return "00'";

  const numericMinute = Number(minute);
  const phase = arguments[1] || "regulation";
  if (phase === "overtime") {
    return `${numericMinute}'`;
  }

  if (numericMinute > 90) {
    return `90+${numericMinute - 90}'`;
  }

  return `${numericMinute}'`;
}

function getStatusLabel(match) {
  if (match.status === "awaitingOvertime") return "Empate - pronto para prorrogacao";
  if (match.status === "awaitingPenalties") return "Empate - pronto para penaltis";
  if (match.phase === "overtime") return "Prorrogacao em andamento";
  if (match.phase === "penalties") return "Penaltis em andamento";
  return "Partida em andamento";
}

function getPhaseLabel(phase) {
  if (phase === "overtime") return "Prorrogacao";
  if (phase === "penalties") return "Penaltis";
  return "Tempo normal";
}

function getEmptyEventLabel(match) {
  if (match.phase === "penalties") return "Penaltis iniciados. Digite o placar direto e finalize a partida.";
  if (match.phase === "overtime") return "Prorrogacao iniciada. Adicione o primeiro evento.";
  if (match.status === "awaitingOvertime") return "Empate no tempo normal. Clique em Continuar jogo.";
  if (match.status === "awaitingPenalties") return "Empate na prorrogacao. Clique em Iniciar penaltis.";
  return "Partida iniciada. Adicione o primeiro evento.";
}

function updateEventTypeOptions() {
  if (!activeMatch || activeMatch.phase === "penalties") return;

  eventType.innerHTML = `
    <option value="goal">Gol</option>
    <option value="yellow">Cartao amarelo</option>
    <option value="red">Cartao vermelho</option>
    <option value="missedPenalty">Penalti perdido</option>
  `;
  if (!["goal", "yellow", "red", "missedPenalty"].includes(eventType.value)) {
    eventType.value = "goal";
  }
}

function getMinuteRange(phase) {
  if (phase === "overtime") {
    return { min: 91, max: 120 };
  }

  if (phase === "penalties") {
    return { min: 1, max: 20 };
  }

  return { min: 1, max: 105 };
}

function syncMinuteRange(phase) {
  const range = getMinuteRange(phase);
  eventMinute.min = String(range.min);
  eventMinute.max = String(range.max);
}

function togglePenaltyMode(isPenaltyPhase) {
  penaltyControls.classList.toggle("hidden", !isPenaltyPhase);
  addEventBtn.classList.toggle("hidden", isPenaltyPhase);
  document.querySelector(".control-grid").classList.toggle("hidden", isPenaltyPhase);
}

function applyPenaltyScore() {
  const homeValue = Number(homePenaltyScore.value);
  const awayValue = Number(awayPenaltyScore.value);

  if (!Number.isInteger(homeValue) || homeValue < 0 || !Number.isInteger(awayValue) || awayValue < 0) {
    alert("Digite o placar dos penaltis para os dois times.");
    return false;
  }

  activeMatch.penalties[TEAM_HOME] = homeValue;
  activeMatch.penalties[TEAM_AWAY] = awayValue;
  renderActiveMatch();
  return true;
}

function formatScoreDisplay(match, team) {
  const regularScore = match.score[team];
  if (match.phase === "penalties" || hasPenaltyResult(match)) {
    return `${regularScore} (${match.penalties[team]}x)`;
  }
  return String(regularScore);
}

function hasPenaltyResult(match) {
  return Boolean(match.penalties && (match.penalties[TEAM_HOME] || match.penalties[TEAM_AWAY]));
}

function formatHistoryScore(match, homeGoals, awayGoals, homeTeam, awayTeam) {
  if (hasPenaltyResult(match)) {
    return `${homeTeam} ${homeGoals} (${match.penalties[homeTeam]}x) x (${match.penalties[awayTeam]}x) ${awayGoals} ${awayTeam}`;
  }

  return `${homeTeam} ${homeGoals} x ${awayGoals} ${awayTeam}`;
}

function getOpponentTeam(team) {
  return team === TEAM_HOME ? TEAM_AWAY : TEAM_HOME;
}

function getDisplayedTeams() {
  if (activeMatch) {
    return {
      homeTeam: activeMatch.homeTeam,
      awayTeam: activeMatch.awayTeam,
    };
  }

  return {
    homeTeam: selectedHomeTeam,
    awayTeam: getOpponentTeam(selectedHomeTeam),
  };
}

function renderDisplayedTeams(homeTeam, awayTeam) {
  homeTeamName.textContent = homeTeam;
  awayTeamName.textContent = awayTeam;
  homeTeamPicker.value = homeTeam;
  syncCrest(homeCrest, homeTeam);
  syncCrest(awayCrest, awayTeam);
  renderForms();
  renderChances();
}

function syncCrest(element, team) {
  element.src = crestMap[team].src;
  element.alt = crestMap[team].alt;
}

function getRecentHistory() {
  return history.slice(0, HISTORY_PAGE_SIZE);
}

function loadAppState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { history: [], scorerOverrides: {} };
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { history: normalizeHistoryPlayers(parsed), scorerOverrides: {} };
    }

    return {
      history: normalizeHistoryPlayers(Array.isArray(parsed.history) ? parsed.history : []),
      scorerOverrides:
        parsed.scorerOverrides && typeof parsed.scorerOverrides === "object"
          ? parsed.scorerOverrides
          : {},
    };
  } catch {
    return { history: [], scorerOverrides: {} };
  }
}

function saveAppState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      history,
      scorerOverrides,
    })
  );
}

function generateHistoryToken() {
  try {
    const payload = {
      version: 3,
      history: compactHistory(history),
      scorerOverrides,
    };
    return encodeToken(payload);
  } catch (error) {
    console.error(error);
    alert("Nao foi possivel gerar o token do historico.");
    return "";
  }
}

async function importHistoryTokenFromFile(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const token = (await file.text()).trim();
    if (!token) {
      throw new Error("Arquivo de token vazio.");
    }

    const payload = decodeToken(token);
    if (!payload) {
      throw new Error("Token invalido.");
    }

    const importedState = expandHistoryPayload(payload);
    history = importedState.history;
    scorerOverrides = importedState.scorerOverrides;
    historyPage = 1;
    saveAppState();
    renderHistory();
    renderForms();
    renderChances();
    renderOverallStats();
    renderTopScorers();
    renderTopCards();
    renderPlayerSuggestions();
    renderActiveMatch();
    alert("Historico importado com sucesso.");
  } catch (error) {
    console.error(error);
    alert(getErrorMessage(error, "Nao foi possivel importar o token."));
  } finally {
    uploadTokenInput.value = "";
  }
}

function downloadHistoryToken() {
  try {
    const token = generateHistoryToken();
    if (!token) return;

    const blob = new Blob([token], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

    link.href = url;
    link.download = `historico-${stamp}.token.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
    alert("Nao foi possivel baixar o token.");
  }
}

function encodeToken(payload) {
  const json = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(json)));
}

function decodeToken(token) {
  const json = decodeURIComponent(escape(atob(token)));
  return JSON.parse(json);
}

function compactHistory(matches) {
  return matches.map((match) => {
    return [
      teamCodeMap[match.homeTeam],
      teamCodeMap[match.awayTeam],
      match.score[TEAM_HOME],
      match.score[TEAM_AWAY],
      match.penalties?.[TEAM_HOME] || 0,
      match.penalties?.[TEAM_AWAY] || 0,
      phaseCodeMap[match.phase] || "r",
      match.startedAt || "",
      match.endedAt || "",
      Array.isArray(match.events)
        ? match.events.map((event) => [
            teamCodeMap[event.team],
            eventTypeCodeMap[event.type] || "g",
            event.player,
            event.minute,
            phaseCodeMap[event.phase] || "r",
          ])
        : [],
    ];
  });
}

function expandCompactMatch(match) {
  const [
    homeCode,
    awayCode,
    atleticoScore,
    kawasakiScore,
    atleticoPenalties,
    kawasakiPenalties,
    phaseCode,
    startedAt,
    endedAt,
    compactEvents,
  ] = match;

  const expandedMatch = {
    homeTeam: teamFromCodeMap[homeCode],
    awayTeam: teamFromCodeMap[awayCode],
    score: {
      [TEAM_HOME]: Number(atleticoScore) || 0,
      [TEAM_AWAY]: Number(kawasakiScore) || 0,
    },
    penalties: {
      [TEAM_HOME]: Number(atleticoPenalties) || 0,
      [TEAM_AWAY]: Number(kawasakiPenalties) || 0,
    },
    phase: phaseFromCodeMap[phaseCode] || "regulation",
    startedAt: startedAt || "",
    endedAt: endedAt || "",
    events: Array.isArray(compactEvents)
      ? compactEvents.map((event) => ({
          team: teamFromCodeMap[event[0]],
          type: eventTypeFromCodeMap[event[1]] || "goal",
          player: formatPlayerName(event[2]),
          minute: Number(event[3]) || 0,
          phase: phaseFromCodeMap[event[4]] || "regulation",
        }))
      : [],
  };

  expandedMatch.result = getMatchResult(expandedMatch);
  return expandedMatch;
}

function expandHistoryPayload(payload) {
  if (payload.version === 3) {
    if (!Array.isArray(payload.history)) {
      throw new Error("Token invalido.");
    }

    return {
      history: payload.history.map(expandCompactMatch),
      scorerOverrides:
        payload.scorerOverrides && typeof payload.scorerOverrides === "object"
          ? payload.scorerOverrides
          : {},
    };
  }

  if (payload.version === 2) {
    if (!Array.isArray(payload.history)) {
      throw new Error("Token invalido.");
    }

    return {
      history: payload.history.map(expandCompactMatch),
      scorerOverrides: {},
    };
  }

  if (payload.version === 1 && Array.isArray(payload.history)) {
    return {
      history: payload.history,
      scorerOverrides: {},
    };
  }

  throw new Error("Token invalido.");
}

function getScorerOverrideKey(name, team) {
  return `${normalizePlayerName(name)}::${team}`;
}

function normalizeHistoryPlayers(matches) {
  return matches.map((match) => ({
    ...match,
    events: Array.isArray(match.events)
      ? match.events.map((event) => ({
          ...event,
          player: formatPlayerName(event.player),
        }))
      : [],
  }));
}

function editScorerGoals(name, team, currentGoals) {
  const value = window.prompt(
    `Editar gols de ${name} (${team}).\nUse um numero menor que 0 para remover da artilharia.`,
    String(currentGoals)
  );

  if (value === null) {
    return;
  }

  const parsedGoals = Number(value.trim());
  if (!Number.isFinite(parsedGoals) || !Number.isInteger(parsedGoals)) {
    alert("Digite um numero inteiro valido.");
    return;
  }

  scorerOverrides[getScorerOverrideKey(name, team)] = parsedGoals;
  saveAppState();
  renderTopScorers();
}

function getErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

function renderPlayerSuggestions() {
  hidePlayerSuggestions();
}

function collectKnownPlayers() {
  const names = new Map();

  history.forEach((match) => {
    (match.events || []).forEach((event) => {
      if (event.player) {
        upsertKnownPlayer(names, event.player);
      }
    });
  });

  if (activeMatch) {
    (activeMatch.events || []).forEach((event) => {
      if (event.player) {
        upsertKnownPlayer(names, event.player);
      }
    });
  }

  return [...names.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function handlePlayerInput() {
  const query = playerName.value.trim();
  const players = collectKnownPlayers();
  const filtered = !query
    ? players.slice(0, 8)
    : players
        .filter((name) => normalizePlayerName(name).includes(normalizePlayerName(query)))
        .slice(0, 8);

  if (filtered.length === 0) {
    hidePlayerSuggestions();
    return;
  }

  playerSuggestions.innerHTML = filtered
    .map((name, index) => `
      <button class="player-suggestion-item${index === 0 ? " active" : ""}" type="button" data-player-name="${escapeHtml(name)}">
        ${escapeHtml(name)}
      </button>
    `)
    .join("");

  playerSuggestions.querySelectorAll(".player-suggestion-item").forEach((button) => {
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
      applyPlayerSuggestion(button.dataset.playerName || "");
    });
  });

  playerSuggestions.classList.remove("hidden");
}

function handlePlayerSuggestionKeydown(event) {
  if (playerSuggestions.classList.contains("hidden")) return;

  const items = [...playerSuggestions.querySelectorAll(".player-suggestion-item")];
  if (items.length === 0) return;

  const activeIndex = items.findIndex((item) => item.classList.contains("active"));

  if (event.key === "ArrowDown") {
    event.preventDefault();
    setActiveSuggestion(items, Math.min(activeIndex + 1, items.length - 1));
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    setActiveSuggestion(items, Math.max(activeIndex - 1, 0));
    return;
  }

  if (event.key === "Enter") {
    const activeItem = items[activeIndex >= 0 ? activeIndex : 0];
    if (activeItem) {
      event.preventDefault();
      applyPlayerSuggestion(activeItem.dataset.playerName || "");
    }
    return;
  }

  if (event.key === "Escape") {
    hidePlayerSuggestions();
  }
}

function setActiveSuggestion(items, index) {
  items.forEach((item, itemIndex) => {
    item.classList.toggle("active", itemIndex === index);
  });
}

function applyPlayerSuggestion(name) {
  playerName.value = name;
  hidePlayerSuggestions();
}

function hidePlayerSuggestions() {
  playerSuggestions.classList.add("hidden");
  playerSuggestions.innerHTML = "";
}

function handleDocumentClick(event) {
  if (event.target === playerName || playerSuggestions.contains(event.target)) {
    return;
  }

  hidePlayerSuggestions();
}

function normalizePlayerName(name) {
  return String(name)
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function formatPlayerName(name) {
  return String(name)
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLocaleLowerCase("pt-BR");
      return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
    })
    .join(" ");
}

function getCanonicalPlayerName(name) {
  const cleaned = formatPlayerName(name);
  const normalized = normalizePlayerName(cleaned);
  const existing = collectKnownPlayers().find((player) => normalizePlayerName(player) === normalized);
  return existing ? formatPlayerName(existing) : cleaned;
}

function upsertKnownPlayer(map, name) {
  const cleaned = formatPlayerName(name);
  if (!cleaned) return;

  const key = normalizePlayerName(cleaned);
  if (!map.has(key)) {
    map.set(key, cleaned);
  }
}

function describeDate(isoDate) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(isoDate));
}
