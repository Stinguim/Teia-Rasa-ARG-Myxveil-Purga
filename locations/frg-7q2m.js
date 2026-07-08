/* =========================================================
   frg-7q2m.js — Log 34 (transcrição com fragmentos cifrados)
========================================================= */

const locMain = document.getElementById("loc-main");

const backgroundMusic = new Audio("../audio/The-Chair.ogg");

backgroundMusic.loop = true;
backgroundMusic.volume = 0.4;

document.addEventListener("DOMContentLoaded", () => {

  backgroundMusic.play().catch(() => {
      document.addEventListener("click", () => {
          backgroundMusic.play().catch(() => {});
      }, { once: true });
  });

  requestAnimationFrame(() => {
    locMain.classList.remove("hidden-init");
    requestAnimationFrame(() => {
      locMain.classList.add("visible");
    });
  });
});
