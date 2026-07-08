/* =========================================================
   status.js — bloco de status persistente [CORROMPIDO]
   Usado nas páginas de locations/. Lê ../config.json e
   calcula o UPTIME a partir do instante de início guardado
   em localStorage (arg_start_time).

   Esta versão simula corrupção permanente + a sensação de
   estar a ser observado: o sistema por vezes "congela" por
   alguns segundos (como se algo tivesse parado a decidir
   o que mostrar), reage com pequenos cortes de transmissão
   (flicker), e o UPTIME pode saltar no tempo quando o
   congelamento termina — como se tivesse sido manipulado
   enquanto ninguém olhava.
========================================================= */

(function () {
  const GLITCH_CHARS = "#%&$@?!01¤§*■□";
  const STATUS_VARIANTS = ["0NLINE", "ONL#NE", "ON$INE", "ONLIN£"];

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

  function corrupt(str, intensity = 0.18) {
    return str
      .split("")
      .map((ch) => {
        if (ch === " " || ch === ":") return ch;
        return Math.random() < intensity ? randomChar() : ch;
      })
      .join("");
  }

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

  /* =========================================================
     COMPORTAMENTO "OBSERVADO"
  ========================================================= */

  let frozenUntil = 0;
  let flickerActive = false;
  let timeSkew = 0;

  function maybeFreeze() {
    const now = Date.now();
    if (now < frozenUntil) return true;

    if (Math.random() < 0.06) {
      const freezeMs = 1800 + Math.random() * 2600;
      frozenUntil = now + freezeMs;
      return true;
    }
    return false;
  }

  function flickerThenSet(el, finalText) {
    if (!el || flickerActive) {
      if (el) el.textContent = finalText;
      return;
    }

    if (Math.random() < 0.12) {
      flickerActive = true;
      el.textContent = "";
      setTimeout(() => {
        el.textContent = finalText;
        flickerActive = false;
      }, 60 + Math.random() * 120);
    } else {
      el.textContent = finalText;
    }
  }

  function updateUptime(el) {
    if (Date.now() < frozenUntil) return;

    if (Math.random() < 0.03) {
      timeSkew += Math.floor((Math.random() - 0.5) * 40);
    }

    const start = getStartTime();
    let elapsed = Math.floor((Date.now() - start) / 1000) + timeSkew;
    if (elapsed < 0) elapsed = 0;

    const clean = formatElapsed(elapsed);
    flickerThenSet(el, `UPTIME : ${corruptDigits(clean)}`);
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

    function refreshCorruptedFields() {
      // Congelado: nada muda, como se algo estivesse a observar.
      if (maybeFreeze()) return;

      if (statusUser) {
        flickerThenSet(statusUser, `USER : ${corrupt(baseUser)}`);
      }
      if (statusStatus) {
        const variant =
          STATUS_VARIANTS[Math.floor(Math.random() * STATUS_VARIANTS.length)];
        flickerThenSet(statusStatus, `STATUS : ${variant}`);
      }
      if (statusTrack) {
        flickerThenSet(statusTrack, `TRACK : ${corrupt(baseTrack)}`);
      }
    }

    refreshCorruptedFields();
    updateUptime(statusUptime);

    setInterval(() => {
      refreshCorruptedFields();
      updateUptime(statusUptime);
    }, 1000);
  });
})();