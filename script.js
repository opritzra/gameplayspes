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
const historyTokenInput = document.getElementById("historyTokenInput");
const importTokenBtn = document.getElementById("importTokenBtn");
const generateTokenBtn = document.getElementById("generateTokenBtn");
const copyTokenBtn = document.getElementById("copyTokenBtn");
const toggleStatsBtn = document.getElementById("toggleStatsBtn");
const statsChevron = document.getElementById("statsChevron");
const overallStats = document.getElementById("overallStats");
const totalMatchesStat = document.getElementById("totalMatchesStat");
const homeWinsStat = document.getElementById("homeWinsStat");
const awayWinsStat = document.getElementById("awayWinsStat");
const homeRateStat = document.getElementById("homeRateStat");
const awayRateStat = document.getElementById("awayRateStat");
const penaltyControls = document.getElementById("penaltyControls");

const teamSelect = document.getElementById("teamSelect");
const eventType = document.getElementById("eventType");
const playerName = document.getElementById("playerName");
const eventMinute = document.getElementById("eventMinute");
const homePenaltyScore = document.getElementById("homePenaltyScore");
const awayPenaltyScore = document.getElementById("awayPenaltyScore");
const STORAGE_KEY = "elgamepreidepes-history";

let activeMatch = null;
let history = loadHistory();
let selectedHomeTeam = TEAM_HOME;
let statsOpen = false;
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

createMatchBtn.addEventListener("click", startMatch);
homeTeamPicker.addEventListener("change", handleHomeTeamChange);
addEventBtn.addEventListener("click", addEvent);
continueMatchBtn.addEventListener("click", continueMatch);
finishMatchBtn.addEventListener("click", finishMatch);
toggleStatsBtn.addEventListener("click", toggleStats);
prevHistoryBtn.addEventListener("click", () => changeHistoryPage(-1));
nextHistoryBtn.addEventListener("click", () => changeHistoryPage(1));
importTokenBtn.addEventListener("click", importHistoryToken);
generateTokenBtn.addEventListener("click", generateHistoryToken);
copyTokenBtn.addEventListener("click", copyHistoryToken);

renderHistory();
renderForms();
renderChances();
renderOverallStats();
renderActiveMatch();
generateHistoryToken();

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
  const player = playerName.value.trim();
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
  saveHistory(history);

  activeMatch = null;
  renderActiveMatch();
  renderHistory();
  renderForms();
  renderChances();
  renderOverallStats();
  generateHistoryToken();
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
  currentMinute.textContent = formatMinute(getCurrentMinute(activeMatch));
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
            <span class="minute-chip">${formatMinute(event.minute)}</span>
          </div>
          <div class="event-body">
            <strong>${event.team}</strong> - ${event.player} (${getPhaseLabel(event.phase)})
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

  totalMatchesStat.textContent = String(totalMatches);
  homeWinsStat.textContent = String(homeWins);
  awayWinsStat.textContent = String(awayWins);
  homeRateStat.textContent = `Taxa de vitoria: ${calculateRate(homeWins, totalMatches)}%`;
  awayRateStat.textContent = `Taxa de vitoria: ${calculateRate(awayWins, totalMatches)}%`;
}

function toggleStats() {
  statsOpen = !statsOpen;
  overallStats.classList.toggle("hidden", !statsOpen);
  toggleStatsBtn.setAttribute("aria-expanded", String(statsOpen));
  statsChevron.textContent = statsOpen ? "-" : "+";
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

    saveHistory(history);
    renderHistory();
    renderForms();
    renderChances();
    renderOverallStats();
    renderActiveMatch();
    generateHistoryToken();
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
    return { min: 106, max: 120 };
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

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(matches) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
}

function generateHistoryToken() {
  try {
    const payload = {
      version: 1,
      history,
    };
    historyTokenInput.value = encodeToken(payload);
    return historyTokenInput.value;
  } catch (error) {
    console.error(error);
    alert("Nao foi possivel gerar o token do historico.");
    return "";
  }
}

function importHistoryToken() {
  const token = historyTokenInput.value.trim();

  if (!token) {
    alert("Cole um token antes de importar.");
    return;
  }

  try {
    const payload = decodeToken(token);
    if (!Array.isArray(payload?.history)) {
      throw new Error("Token invalido.");
    }

    history = payload.history;
    historyPage = 1;
    saveHistory(history);
    renderHistory();
    renderForms();
    renderChances();
    renderOverallStats();
    renderActiveMatch();
    generateHistoryToken();
    alert("Historico importado com sucesso.");
  } catch (error) {
    console.error(error);
    alert(getErrorMessage(error, "Nao foi possivel importar o token."));
  }
}

async function copyHistoryToken() {
  const token = historyTokenInput.value.trim() || generateHistoryToken();
  if (!token) return;

  try {
    await navigator.clipboard.writeText(token);
    alert("Token copiado.");
  } catch (error) {
    console.error(error);
    alert("Nao foi possivel copiar. Copie manualmente pelo campo.");
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

function getErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

function describeDate(isoDate) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(isoDate));
}
