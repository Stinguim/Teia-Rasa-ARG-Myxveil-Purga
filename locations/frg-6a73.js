/* =========================================================
   frg-6a73.js — reveal da página (consistente com as outras)
========================================================= */

const locMain = document.getElementById("loc-main");
/* Música */

const backgroundMusic = new Audio("../audio/overpopulation.ogg");

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