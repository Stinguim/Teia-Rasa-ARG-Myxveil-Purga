// ===============================
// PURGA SEMPRE ATIVA NESTE REPO
// ===============================
window.PURGA_ACTIVE = true;
window.TERMINAL_FORCE_PURGA_RESPONSES = false;
/* =========================================================
   ARG TERMINAL — script.js (com temas + sons via config.json)
========================================================= */

let CONFIG = null;
let cursorVisible = true;
let inputFocused = false;

let backgroundMusic;
let errorSound;
let clickSound;
let bootSound;
let keySound;
let accessSound;

/* ELEMENTOS */
const bootScreen = document.getElementById("boot-screen");
const bootLinesEl = document.getElementById("boot-lines");

const mainScreen = document.getElementById("main-screen");
const promptLabel = document.getElementById("prompt-label");

const keyDisplay = document.getElementById("key-display");
const keyRealInput = document.getElementById("key-real-input");
const keyResponse = document.getElementById("key-response");

const terminalIcon = document.querySelector(".terminal-icon");
const fadeScreen = document.getElementById("fade-screen");

const statusUser = document.getElementById("status-user");
const statusStatus = document.getElementById("status-status");
const statusTrack = document.getElementById("status-track");
const statusUptime = document.getElementById("status-uptime");

/* =========================================================
   CORRUPÇÃO DE STATS — sempre visível
   (mesma lógica usada em locations/status.js)
========================================================= */

const STATUS_GLITCH_CHARS = "#%&$@?!01¤§*■□";
const STATUS_VARIANTS = ["0NLINE", "ONL#NE", "ON$INE", "ONLIN£"];

function statusRandomChar() {
  return STATUS_GLITCH_CHARS[Math.floor(Math.random() * STATUS_GLITCH_CHARS.length)];
}

function statusCorrupt(str, intensity = 0.18) {
  return str
    .split("")
    .map((ch) => {
      if (ch === " " || ch === ":") return ch;
      return Math.random() < intensity ? statusRandomChar() : ch;
    })
    .join("");
}

function statusCorruptDigits(str, intensity = 0.22) {
  return str
    .split("")
    .map((ch) => {
      if (!/[0-9]/.test(ch)) return ch;
      return Math.random() < intensity ? statusRandomChar() : ch;
    })
    .join("");
}

/* =========================================================
   COMPORTAMENTO "OBSERVADO" — pausas e hesitação
   Não é ruído aleatório contínuo: às vezes o sistema
   pára, hesita, ou reage com atraso — como se algo
   estivesse a decidir o que mostrar.
========================================================= */

let statusFrozenUntil = 0;   // timestamp até ao qual os valores não mudam
let statusFlickerActive = false;

// Decide, a cada tick, se o sistema vai "congelar" por uns segundos
function maybeFreezeStatus() {
  const now = Date.now();
  if (now < statusFrozenUntil) return true; // ainda congelado

  // ~6% de hipótese por tick de entrar em pausa longa
  if (Math.random() < 0.06) {
    const freezeMs = 1800 + Math.random() * 2600; // 1.8s a 4.4s
    statusFrozenUntil = now + freezeMs;
    return true;
  }
  return false;
}

// Pequeno "corte" visual antes de mostrar um valor novo,
// como se a transmissão tivesse falhado por um instante
function flickerThenSet(el, finalText) {
  if (!el || statusFlickerActive) {
    if (el) el.textContent = finalText;
    return;
  }

  // só faz flicker ocasionalmente, senão fica cansativo
  if (Math.random() < 0.12) {
    statusFlickerActive = true;
    el.textContent = "";
    setTimeout(() => {
      el.textContent = finalText;
      statusFlickerActive = false;
    }, 60 + Math.random() * 120);
  } else {
    el.textContent = finalText;
  }
}

/* =========================================================
   TEMPO PERSISTENTE (localStorage)
========================================================= */

function getStartTime() {
  let start = localStorage.getItem("arg_start_time");
  if (!start) {
    start = Date.now().toString();
    localStorage.setItem("arg_start_time", start);
  }
  return parseInt(start, 10);
}

/* =========================================================
   LOAD CONFIG.JSON
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    CONFIG = await fetch("config.json").then(r => {
      if (!r.ok) throw new Error(`config.json respondeu com estado ${r.status}`);
      return r.json();
    });

    /* Sons */
    backgroundMusic = new Audio(CONFIG.audio.background);
    backgroundMusic.loop = true;
    backgroundMusic.volume = CONFIG.audio.volume;

    errorSound = new Audio(CONFIG.audio.error);
    clickSound = new Audio(CONFIG.audio.click);
    bootSound = new Audio(CONFIG.audio.boot);

    keySound = new Audio(CONFIG.audio.key);
    keySound.volume = 0.5;

    accessSound = new Audio(CONFIG.audio.access);
    accessSound.volume = 0.7;

    /* Aplicar tema ao CSS */
    applyTheme(CONFIG.theme);
  } catch (err) {
    console.error("Falha ao carregar config.json:", err);
    document.body.innerHTML =
      '<div style="color:#ff5555;font-family:monospace;padding:40px;">' +
      'ERRO CRÍTICO: não foi possível carregar config.json.<br>' +
      'Se estás a abrir este ficheiro diretamente (file://), ' +
      'corre um servidor local (ex: <code>python3 -m http.server</code>) e tenta novamente.' +
      '</div>';
    return;
  }

  /* Timestamp de início persistente (para o UPTIME não reiniciar entre páginas) */
  getStartTime();

  /* Autoplay fix */
  document.addEventListener("click", () => {
    backgroundMusic.play().catch(() => {});
  }, { once: true });

  promptLabel.textContent = "INSIRA A CHAVE DE ACESSO";


/* =========================================================
   APLICAR TEMA AO CSS
========================================================= */

function applyTheme(theme) {
  const root = document.documentElement;

  root.style.setProperty("--bg", theme.colors.bg);
  root.style.setProperty("--green", theme.colors.primary);
  root.style.setProperty("--green-dim", theme.colors.dim);
  root.style.setProperty("--green-faint", theme.colors.faint);
  root.style.setProperty("--amber-error", theme.colors.error);

  if (!theme.crt.scanlines) {
    document.body.style.setProperty("--disable-scanlines", "true");
  }
}

/* =========================================================
   BOOT SEQUENCE + BOTÃO PROCEDER
========================================================= */

function startBoot(username) {
  bootScreen.classList.remove("hidden");
  bootLinesEl.textContent = "";

  bootSound.play().catch(() => {});

  const lines = [...CONFIG.boot.lines, `Utilizador reconhecido: ${username}`];
  let i = 0;

  function nextLine() {
    if (i < lines.length) {
      appendBootLine(lines[i]);
      i++;
      setTimeout(nextLine, 90 + Math.random() * 160);
    } else {
      setTimeout(showProceedButton, 600);
    }
  }

  if (window.PURGA_ACTIVE) {
    setTimeout(() => startPurga(), 4000);
  } 

  nextLine();
}

/* Scroll inteligente */
function appendBootLine(text) {
  const MAX_LINES = CONFIG.bootMaxLines;

  const current = bootLinesEl.textContent.split("\n");
  current.push(text);

  if (current.length > MAX_LINES) {
    current.shift();
  }

  bootLinesEl.textContent = current.join("\n");
}

/* Botão PROCEDER */
function showProceedButton() {
  const btn = document.createElement("button");
  btn.textContent = "PROCEDER";
  btn.className = "boot-proceed-btn";

  setTimeout(() => {
    bootScreen.appendChild(btn);
  }, 50);

  btn.addEventListener("click", () => {
    clickSound.play().catch(() => {});
    fadeToMain();
  });
}

function fadeToMain() {
  fadeScreen.classList.add("active");

  setTimeout(() => {
    bootScreen.classList.add("hidden");

    mainScreen.classList.remove("hidden-init");
    fadeScreen.classList.remove("active");

    showMainScreen();
  }, 800);
}

/* =========================================================
   MAIN SCREEN
========================================================= */

function showMainScreen() {
  requestAnimationFrame(() => {
    mainScreen.classList.add("visible");
  });

  renderKeyDisplay("");
  keyRealInput.focus();

  refreshCorruptedStatus();

  updateUptime();
  setInterval(updateUptime, 1000);
  setInterval(refreshCorruptedStatus, 1000);

  if (window.PURGA_ACTIVE) {
    startPurga();
  }
}

/* =========================================================
   STATUS CORROMPIDO — USER / STATUS / TRACK
   Re-executado a cada segundo para nunca estabilizar
========================================================= */

function refreshCorruptedStatus() {
  // Se o sistema está "congelado", não muda nada — como se
  // algo estivesse a observar em silêncio antes de reagir.
  if (maybeFreezeStatus()) return;

  if (statusUser) {
    flickerThenSet(statusUser, `USER : ${statusCorrupt(CONFIG.username)}`);
  }
  if (statusStatus) {
    const variant =
      STATUS_VARIANTS[Math.floor(Math.random() * STATUS_VARIANTS.length)];
    flickerThenSet(statusStatus, `STATUS : ${variant}`);
  }
  if (statusTrack) {
    flickerThenSet(statusTrack, `TRACK : ${statusCorrupt(CONFIG.track)}`);
  }
}

/* =========================================================
   UPTIME
========================================================= */

let uptimeTimeSkew = 0; // desvio acumulado, como se o tempo fosse manipulado

function updateUptime() {
  // Durante o congelamento, o relógio não avança — como se
  // tivesse parado enquanto algo observava.
  if (Date.now() < statusFrozenUntil) return;

  // Ocasionalmente o tempo "salta" vários segundos de repente,
  // para trás ou para a frente, quando o freeze acaba.
  if (Math.random() < 0.03) {
    uptimeTimeSkew += Math.floor((Math.random() - 0.5) * 40);
  }

  const start = getStartTime();
  let elapsed = Math.floor((Date.now() - start) / 1000) + uptimeTimeSkew;
  if (elapsed < 0) elapsed = 0;

  const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const s = String(elapsed % 60).padStart(2, "0");

  const clean = `${h}:${m}:${s}`;
  flickerThenSet(statusUptime, `UPTIME : ${statusCorruptDigits(clean)}`);
}

/* =========================================================
   INPUT DA CHAVE
========================================================= */

let lastKeySound = 0;

mainScreen.addEventListener("click", () => keyRealInput.focus());

keyRealInput.addEventListener("input", () => {
  renderKeyDisplay(keyRealInput.value);

  const now = performance.now();

  // cooldown reduzido — sons sobrepõem-se em vez de cortar o anterior
  if (now - lastKeySound > 15) {
    const soundInstance = keySound.cloneNode();
    soundInstance.volume = keySound.volume;
    soundInstance.play().catch(() => {});
    lastKeySound = now;
  }
});

keyRealInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkKey(keyRealInput.value);
});

keyRealInput.addEventListener("focus", () => {
  inputFocused = true;
  renderKeyDisplay(keyRealInput.value);
});

keyRealInput.addEventListener("blur", () => {
  inputFocused = false;
  renderKeyDisplay(keyRealInput.value);
});

/* =========================================================
   RENDER DO CAMPO
========================================================= */

function renderKeyDisplay(value) {
  const escaped = [...value].map(escapeHtml).join("");
  const cursor = inputFocused && (value.length > 0 || cursorVisible)
    ? '<span class="placeholder-char">|</span>'
    : "";

  keyDisplay.innerHTML = escaped + cursor;
}

setInterval(() => {
  if (inputFocused && keyRealInput.value.length === 0) {
    cursorVisible = !cursorVisible;
    renderKeyDisplay("");
  }
}, 500);

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* =========================================================
   VALIDAÇÃO DA CHAVE
========================================================= */

function checkKey(rawValue) {
  const value = rawValue.trim().toUpperCase();

  if (!value) {
    setResponse("...", false);
    return;
  }

  const entry = CONFIG.keys[value];
  entry
    ? setResponse(entry.message, entry.ok, value)
    : setResponse("...", false);
}

let responseTypeToken = 0;

function setResponse(message, ok, key = "") {
  keyResponse.classList.toggle("ok", ok);
  keyResponse.classList.toggle("err", !ok);

  typeResponse(message);

  if (window.TERMINAL_FORCE_PURGA_RESPONSES) {
    message = "...";
    ok = false;
  }

  if (!ok) {
    errorSound.currentTime = 0;
    errorSound.play();
    return;
  }

  // Som de acesso concedido
  accessSound.currentTime = 0;
  accessSound.play().catch(() => {});

  // Chave especial que muda de página
  if (key === "REMEMBER THIS") {
    const typingTime = message.length * 42; // média do intervalo por caráter em typeResponse
    const readingBuffer = 1800; // tempo extra para ler a frase já completa
    setTimeout(() => fadeTo("locations/loc1.html"), typingTime + readingBuffer);
  }

  if (key === "2A7RF") {
    const typingTime = message.length * 42;
    const readingBuffer = 1800;
    setTimeout(() => fadeTo("locations/frg-7q2m.html"), typingTime + readingBuffer);
  }

  if (key === "SNLY") {
    const typingTime = message.length * 42;
    const readingBuffer = 1800;
    setTimeout(() => fadeTo("locations/frg-6a73.html"), typingTime + readingBuffer);
  }

  if (key === "8652") {
    const typingTime = message.length * 42;
    const readingBuffer = 1800;
    setTimeout(() => fadeTo("locations/frg-3z9k.html"), typingTime + readingBuffer);
  }

  if (key === "2A7RFSNLY8652PROMESSAS") {
    const typingTime = message.length * 42;
    const readingBuffer = 1800;
    setTimeout(() => triggerFinalSequence(), typingTime + readingBuffer);
  }
}

/* Escreve a mensagem de resposta letra a letra */
function typeResponse(message) {
  const token = ++responseTypeToken;
  keyResponse.textContent = "";

  let i = 0;

  function typeChar() {
    if (token !== responseTypeToken) return; // resposta cancelada por uma nova
    if (i <= message.length) {
      keyResponse.textContent = message.slice(0, i);
      i++;
      setTimeout(typeChar, 25 + Math.random() * 35);
    }
  }

  typeChar();
}

/* =========================================================
   SEQUÊNCIA FINAL — ARG COMPLETO
========================================================= */

function triggerFinalSequence() {
  const icon = document.querySelector(".terminal-icon");
  const finalReveal = document.getElementById("final-reveal");

  /* Guarda o tempo total que o jogador demorou a completar o ARG */
  const start = getStartTime();
  const totalSeconds = Math.floor((Date.now() - start) / 1000);
  localStorage.setItem("arg_completed_seconds", totalSeconds.toString());

  backgroundMusic.pause();

  icon.classList.add("final-icon-up");
  promptLabel.style.display = "none";
  document.querySelector(".key-input-wrap").style.display = "none";
  keyResponse.style.display = "none";

  setTimeout(() => {
    finalReveal.classList.remove("hidden");
    requestAnimationFrame(() => finalReveal.classList.add("visible"));
  }, 900);
}

/* =========================================================
   FADE
========================================================= */

function fadeTo(page) {
  fadeScreen.classList.add("active");
  setTimeout(() => {
    window.location.href = page;
  }, 800);
}

// =========================================================
// PURGA — CORRUPÇÃO TOTAL
// =========================================================

let purgaStarted = false;

function startPurga() {

    if (purgaStarted) return;
    purgaStarted = true;

  console.warn("⚠ PURGA ATIVADA — Sistema corrompido");

  // 1. Ativar overlay glitch
  const overlay = document.getElementById("purga-glitch-overlay");
  if (overlay) {
      overlay.classList.remove("hidden");
      overlay.classList.add("active");
  }

  // 2. Modo Purga visual
  document.documentElement.classList.add("purga-mode");

  const root = document.documentElement;

  root.style.setProperty("--bg", "#0a0000");
  root.style.setProperty("--green", "#ff1a1a");
  root.style.setProperty("--green-dim", "#b30000");
  root.style.setProperty("--green-faint", "#660000");
  root.style.setProperty("--amber-error", "#ff4444");

  // 3. Substituir BEPO por monstro
  const bepoImg = document.getElementById("bepo-img");
  if (bepoImg) {
    bepoImg.src = "images/preto.png"; // <-- mete aqui a tua imagem depois
  }

  // 4. Respostas passam a "..."
  window.TERMINAL_FORCE_PURGA_RESPONSES = true;

  // 5. Spam de erros no boot e terminal
  startPurgaSpam();
}

function startPurgaSpam() {
  const boot = document.getElementById("boot-lines");
  const prompt = document.getElementById("prompt-label");

  let corruption = 0;

  setInterval(() => {

      const glitch = generateGlitchText();

      if (boot && !bootScreen.classList.contains("hidden")) {
          appendBootLine(glitch);
      }

      if (prompt && !mainScreen.classList.contains("hidden-init")) {

          corruption += 0.04;

          if (corruption > 1)
              corruption = 1;

          prompt.textContent =
              corruptText("INSIRA A CHAVE DE ACESSO?", corruption);

      }

  }, 800);
}

function generateGlitchText() {
  const chars = "█▓▒<>/\\#@!?%&$αβγδεζλψΩ∴∵";
  let out = "";
  for (let i = 0; i < 20 + Math.random() * 40; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function corruptText(text, corruption) {
    const glitchChars = "█▓▒<>/\\#@!?%&$αβγδεζλψΩ∴∵";

    return [...text].map(char => {

        // Mantém espaços
        if (char === " ") return " ";

        // Probabilidade de corrupção
        if (Math.random() < corruption) {
            return glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }

        return char;

    }).join("");
}
startBoot(CONFIG.username);

}); // Fecha o DOMContentLoaded