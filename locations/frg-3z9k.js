const backgroundMusic = new Audio("../audio/Intertwined.ogg");

backgroundMusic.loop = true;
backgroundMusic.volume = 0.4;

// Tenta reproduzir automaticamente
backgroundMusic.play().catch(() => {
    // Se o navegador bloquear, toca ao primeiro clique
    document.addEventListener("click", () => {
        backgroundMusic.play().catch(() => {});
    }, { once: true });
});

// Atualiza o nome da música no canto inferior direito
const statusTrack = document.getElementById("status-track");

if (statusTrack) {
    statusTrack.textContent = "TRACK : INTERTWINED";
}