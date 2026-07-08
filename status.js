/* =========================================================
   status.js — bloco de status persistente
   Usado nas páginas de locations/. Lê ../config.json e
   calcula o UPTIME a partir do instante de início guardado
   em localStorage (arg_start_time), para o tempo persistir
   entre páginas em vez de reiniciar em cada uma.
========================================================= */

(function () {
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

  function formatElapsed(seconds) {
    const h = pad(Math.floor(seconds / 3600));
    const m = pad(Math.floor((seconds % 3600) / 60));
    const s = pad(seconds % 60);
    return `${h}:${m}:${s}`;
  }

  function updateUptime(el) {
    const start = getStartTime();
    const elapsed = Math.floor((Date.now() - start) / 1000);
    el.textContent = `UPTIME : ${formatElapsed(elapsed)}`;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const statusUser = document.getElementById("status-user");
    const statusStatus = document.getElementById("status-status");
    const statusTrack = document.getElementById("status-track");
    const statusUptime = document.getElementById("status-uptime");

    if (!statusUptime) return;

    try {
      const config = await fetch("../config.json").then(r => r.json());
      if (statusUser) statusUser.textContent = `USER : ${config.username}`;
      if (statusStatus) statusStatus.textContent = "STATUS : ONLINE";
      let trackName = config.track;

      const page = window.location.pathname.split("/").pop();

      switch (page) {
        case "loc1.html":
          trackName = "Let one go";
          break;

        case "frg-3z9k.html":
          trackName = "INTERTWINED";
          break;

        case "frg-6a73.html":
          trackName = "overpopulation at the end of everything is...";
          break;

        case "frg-7q2m.html":
          trackName = "The Chair";
          break;
      }

      if (statusTrack) {
        statusTrack.textContent = `TRACK : ${trackName}`;
      }
    } catch (e) {
      if (statusStatus) statusStatus.textContent = "STATUS : ONLINE";
    }

    updateUptime(statusUptime);
    setInterval(() => updateUptime(statusUptime), 1000);
  });
})();