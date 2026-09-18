// Debate Timer
// Speech: 3 / 5 / 7 min
// Reply Speech: 2 / 4 min
// Extension: starts automatically when Speech reaches 0
// POI: independent 15-second countdown

const speech = {
  duration: 5 * 60,
  remaining: 5 * 60,
  running: false,
  lastTime: null
};

const reply = {
  duration: 4 * 60,
  remaining: 4 * 60,
  running: false,
  lastTime: null
};

const poi = {
  duration: 15,
  remaining: 15,
  running: false,
  lastTime: null
};

const extension = {
  elapsed: 0,
  running: false,
  lastTime: null
};

let frameId = null;

const $ = (id) => document.getElementById(id);

function formatTime(seconds) {
  seconds = Math.max(0, seconds);
  const whole = Math.ceil(seconds);
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function render() {
  $("speechDisplay").textContent = formatTime(speech.remaining);
  $("replyDisplay").textContent = formatTime(reply.remaining);
  $("poiDisplay").textContent = formatTime(poi.remaining);
  $("extensionDisplay").textContent = formatTime(extension.elapsed);

  // Extension color:
  // <= 15 sec green, >15 to <=30 sec yellow, >30 sec red
  const ext = $("extensionDisplay");
  ext.classList.remove("extension-green", "extension-yellow", "extension-red");

  if (extension.elapsed <= 15) {
    ext.classList.add("extension-green");
  } else if (extension.elapsed <= 30) {
    ext.classList.add("extension-yellow");
  } else {
    ext.classList.add("extension-red");
  }

  updatePoiStatus();
}

function updatePoiStatus() {
  const total = speech.duration;

  // Use the exact integer-second boundary shown on screen.
  // This makes POI status switch exactly when the displayed timer
  // reaches the boundary:
  // 3 min -> first/last 15 sec
  // 5 min -> first/last 30 sec
  // 7 min -> first/last 60 sec
  const elapsedShown = Math.floor(total - speech.remaining);
  const remainingShown = Math.ceil(speech.remaining);
  const blocked = total / 10;

  const unavailable =
    elapsedShown < blocked ||
    remainingShown <= blocked;

  const status = $("poiStatus");
  status.textContent = unavailable ? "POI 不可" : "POI 可";
  status.classList.toggle("unavailable", unavailable);
  status.classList.toggle("available", !unavailable);
}

function speechStart() {
  if (speech.remaining <= 0) return;
  speech.running = true;
  speech.lastTime = performance.now();
  startLoop();
}

function speechPause() {
  speech.running = false;
}

function speechReset() {
  speech.running = false;
  speech.remaining = speech.duration;

  // Reset Extension when Speech is reset.
  extension.running = false;
  extension.elapsed = 0;
  extension.lastTime = null;

  render();
}

function replyStart() {
  if (reply.remaining <= 0) return;
  reply.running = true;
  reply.lastTime = performance.now();
  startLoop();
}

function replyPause() {
  reply.running = false;
}

function replyReset() {
  reply.running = false;
  reply.remaining = reply.duration;
  render();
}

function poiStart() {
  if (poi.remaining <= 0) return;
  poi.running = true;
  poi.lastTime = performance.now();
  startLoop();
}

function poiPause() {
  poi.running = false;
}

function poiReset() {
  poi.running = false;
  poi.remaining = poi.duration;
  render();
}

function extensionReset() {
  extension.running = false;
  extension.elapsed = 0;
  extension.lastTime = null;
  render();
}

function startLoop() {
  if (frameId === null) {
    frameId = requestAnimationFrame(tick);
  }
}

function tick(now) {
  if (speech.running) {
    const dt = (now - speech.lastTime) / 1000;
    speech.lastTime = now;
    speech.remaining -= dt;

    if (speech.remaining <= 0) {
      speech.remaining = 0;
      speech.running = false;

      // Speech reaches 0 -> Extension starts immediately.
      extension.running = true;
      extension.lastTime = now;
    }
  }

  if (reply.running) {
    const dt = (now - reply.lastTime) / 1000;
    reply.lastTime = now;
    reply.remaining -= dt;

    if (reply.remaining <= 0) {
      reply.remaining = 0;
      reply.running = false;
    }
  }

  if (poi.running) {
    const dt = (now - poi.lastTime) / 1000;
    poi.lastTime = now;
    poi.remaining -= dt;

    if (poi.remaining <= 0) {
      poi.remaining = 0;
      poi.running = false;
    }
  }

  if (extension.running) {
    const dt = (now - extension.lastTime) / 1000;
    extension.lastTime = now;
    extension.elapsed += dt;
  }

  render();

  const anyRunning =
    speech.running ||
    reply.running ||
    poi.running ||
    extension.running;

  if (anyRunning) {
    frameId = requestAnimationFrame(tick);
  } else {
    frameId = null;
  }
}

// Speech presets
document.querySelectorAll("#speechPresets button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("#speechPresets button")
      .forEach(b => b.classList.remove("selected"));

    button.classList.add("selected");

    speech.duration = Number(button.dataset.minutes) * 60;
    speech.remaining = speech.duration;
    speech.running = false;

    extension.running = false;
    extension.elapsed = 0;
    extension.lastTime = null;

    render();
  });
});

// Reply Speech presets
document.querySelectorAll("#replyPresets button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("#replyPresets button")
      .forEach(b => b.classList.remove("selected"));

    button.classList.add("selected");

    reply.duration = Number(button.dataset.minutes) * 60;
    reply.remaining = reply.duration;
    reply.running = false;

    render();
  });
});

$("speechStart").addEventListener("click", speechStart);
$("speechPause").addEventListener("click", speechPause);
$("speechReset").addEventListener("click", speechReset);

$("replyStart").addEventListener("click", replyStart);
$("replyPause").addEventListener("click", replyPause);
$("replyReset").addEventListener("click", replyReset);

$("poiStart").addEventListener("click", poiStart);
$("poiPause").addEventListener("click", poiPause);
$("poiReset").addEventListener("click", poiReset);

$("extensionReset").addEventListener("click", extensionReset);

render();
