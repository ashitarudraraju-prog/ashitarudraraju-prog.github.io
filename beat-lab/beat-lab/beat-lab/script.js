
const fileInput = document.getElementById("audioFile");
const audio = document.getElementById("audio");
const fileName = document.getElementById("fileName");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let audioContext;
let analyser;
let source;
let animationId;
let currentURL;

function setupCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

setupCanvas();
window.addEventListener("resize", setupCanvas);

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];

  if (!file) return;

  if (currentURL) URL.revokeObjectURL(currentURL);
  currentURL = URL.createObjectURL(file);

  audio.src = currentURL;
  fileName.textContent = file.name;

  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }

  drawIdle();
});

audio.addEventListener("play", async () => {
  if (!audioContext) {
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;

    source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
  }

  await audioContext.resume();

  cancelAnimationFrame(animationId);
  animate();
});

audio.addEventListener("pause", () => {
  cancelAnimationFrame(animationId);
  drawIdle();
});

audio.addEventListener("ended", () => {
  cancelAnimationFrame(animationId);
  drawIdle();
});

function drawBars(data, active) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  ctx.clearRect(0, 0, width, height);

  const bars = 40;
  const gap = 5;
  const barWidth = (width - gap * (bars - 1)) / bars;

  for (let i = 0; i < bars; i++) {
    let value = active
      ? data[Math.floor(i * data.length / bars)]
      : 5;

    const barHeight = Math.max(
      5,
      (value / 255) * height * 0.9
    );

    const x = i * (barWidth + gap);
    const y = (height - barHeight) / 2;

    const gradient = ctx.createLinearGradient(
      0, y + barHeight, 0, y
    );

    gradient.addColorStop(0, "#7c3aed");
    gradient.addColorStop(0.5, "#c084fc");
    gradient.addColorStop(1, "#f0abfc");

    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, 5);
    ctx.fill();
  }
}

function animate() {
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);

  drawBars(data, true);
  animationId = requestAnimationFrame(animate);
}

function drawIdle() {
  drawBars([], false);
}

drawIdle();
