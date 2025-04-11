function createParticles() {
  const chatbox = document.getElementById("chatbox");
  if (!chatbox) return;

  const particleCount = 20;
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.animationDuration = `${Math.random() * 5 + 5}s`;
    particle.style.animationDelay = `${Math.random() * 2}s`;
    chatbox.appendChild(particle);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  createParticles();
});