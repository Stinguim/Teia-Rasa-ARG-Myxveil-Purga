/* =========================================================
   status.js — bloco de status persistente [CORROMPIDO]
   Usado nas páginas de locations/. Lê ../config.json e
   calcula o UPTIME a partir do instante de início guardado
   em localStorage (arg_start_time).

   Esta versão simula corrupção permanente de dados:
   os valores (uptime, user, track, status) são
   intencionalmente instáveis — dígitos e letras trocados
   por glyphs de erro em cada refresh, como se o terminal
   estivesse a falhar.
========================================================= */

(function () {
  const GLITCH_CHARS = "#%&$@?!01¤§*■□";

  function getStartTime() {
    let start = localStorage.getItem("arg_start_time");
    if (!start) {
      start = Date.now().toString();
      localStorage.setItem("arg_start_time", start);
    }
    return parseInt(start, 10);
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function randomChar() {
    return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
  }

  /*
     Corrompe uma string trocando aleatoriamente alguns
     caracteres por glyphs de erro. A intensidade controla
     a probabilidade de cada caráter ser afetado.
  */
  function corrupt(str, intensity = 0.18) {
    return str
      .split("")
      .map((ch) => {
        if (ch === " " || ch === ":") return ch;
        return Math.random() < intensity ? randomChar() : ch;
      })
      .join("");
  }

  /*
     Corrompe especificamente números (dígitos), preservando
     a estrutura HH:MM:SS mas trocando alguns dígitos por
     valores ou símbolos inválidos.
  */
  function corruptDigits(str, intensity = 0.22) {
    return str
      .split("")
      .map((ch) => {
        if (!/[0-9]/.test(ch)) return ch;
        return Math.random() < intensity ? randomChar() : ch;
      })
      .join("");
  }

  function formatElapsed(seconds) {
    const h = pad(Math.floor(seconds / 3600));
    const m = pad(Math.floor((seconds % 3600) / 60));
    const s = pad(seconds % 60);
    return `${h}:${m}:${s}`;
  }

  function updateUptime(el) {
    const start = getStartTime();
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const clean = formatElapsed(elapsed);
    const glitched = corruptDigits(clean);
    el.textContent = `UPTIME : ${glitched}`;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const statusUser = document.getElementById("status-user");
    const statusStatus = document.getElementById("status-status");
    const statusTrack = document.getElementById("status-track");
    const statusUptime = document.getElementById("status-uptime");

    if (!statusUptime) return;

    let baseUser = "UNKNOWN";
    let baseTrack = "UNKNOWN";

    try {
      const config = await fetch("../config.json").then((r) => r.json());
      baseUser = config.username;
      baseTrack = config.track;

      const page = window.location.pathname.split("/").pop();

      switch (page) {
        case "loc1.html":
          baseTrack = "Let one go";
          break;

        case "frg-3z9k.html":
          baseTrack = "INTERTWINED";
          break;

        case "frg-6a73.html":
          baseTrack = "overpopulation at the end of everything is...";
          break;

        case "frg-7q2m.html":
          baseTrack = "The Chair";
          break;
      }
    } catch (e) {
      baseUser = "??????";
      baseTrack = "??????";
    }

    // Estado permanentemente corrompido: STATUS nunca é limpo
    const STATUS_VARIANTS = ["0NLINE", "ONL#NE", "ON$INE", "ONLIN£"];

    function refreshCorruptedFields() {
      if (statusUser) {
        statusUser.textContent = `USER : ${corrupt(baseUser)}`;
      }
      if (statusStatus) {
        const variant =
          STATUS_VARIANTS[Math.floor(Math.random() * STATUS_VARIANTS.length)];
        statusStatus.textContent = `STATUS : ${variant}`;
      }
      if (statusTrack) {
        statusTrack.textContent = `TRACK : ${corrupt(baseTrack)}`;
      }
    }

    refreshCorruptedFields();
    updateUptime(statusUptime);

    // Tudo é re-corrompido a cada segundo, não só o uptime
    setInterval(() => {
      refreshCorruptedFields();
      updateUptime(statusUptime);
    }, 1000);
  });
})();