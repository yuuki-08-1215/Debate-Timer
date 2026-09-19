// Debate Timer — timing is driven by absolute monotonic deadlines.
// This keeps the Speech display, POI boundary, and Extension start on
// exactly the same clock, instead of accumulating frame-by-frame error.

const speech = {
  duration: 5 * 60,
  remaining: 5 * 60,
  running: false,
  endAt: null
};

const reply = {
  duration: 4 * 60,
  remaining: 4 * 60,
  running: false,
  endAt: null
};

const poi = {
  duration: 15,
  remaining: 15,
  running: false,
  endAt: null
};

const extension = {
  elapsed: 0,
  running: false,
  startAt: null
};

let frameId = null;

const $ = (id) => document.getElementById(id);

// performance.now() is monotonic and is therefore better for timer logic
// than counting animation frames.
function now() {
  return performance.now();
}

function formatTime(seconds) {
  const whole = Math.max(0, Math.ceil(seconds - 1e-9));
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function render() {
  $("speechDisplay").textContent = formatTime(speech.remaining);
  $("replyDisplay").textContent = formatTime(reply.remaining);
  $("poiDisplay").textContent = formatTime(poi.remaining);
  $("extensionDisplay").textContent = formatTime(extension.elapsed);

  const ext = $("extensionDisplay");
  ext.classList.remove("extension-green", "extension-yellow", "extension-red");

  if (extension.elapsed < 15) {
    ext.classList.add("extension-green");
  } else if (extension.elapsed < 30) {
    ext.classList.add("extension-yellow");
  } else {
    ext.classList.add("extension-red");
  }

  updatePoiStatus();
}

function getSpeechPoiBlockedSeconds() {
  if (speech.duration === 180) return 15;
  if (speech.duration === 300) return 30;
  if (speech.duration === 420) return 60;
  return 0;
}

function updatePoiStatus() {
  const blocked = getSpeechPoiBlockedSeconds();
  const elapsed = speech.duration - speech.remaining;

  const unavailable =
    elapsed < blocked ||
    speech.remaining <= blocked;

  const status = $("poiStatus");
  status.textContent = unavailable ? "POI 不可" : "POI 可";
  status.classList.toggle("unavailable", unavailable);
  status.classList.toggle("available", !unavailable);
}

function speechStart() {
  if (speech.running || speech.remaining <= 0) return;

  speech.running = true;
  speech.endAt = now() + speech.remaining * 1000;
  startLoop();
}

function speechPause() {
  if (!speech.running) return;
  const t = now();
  speech.remaining = Math.max(0, (speech.endAt - t) / 1000);
  speech.running = false;
  speech.endAt = null;
  render();
}

function speechReset() {
  speech.running = false;
  speech.remaining = speech.duration;
  speech.endAt = null;

  extension.running = false;
  extension.elapsed = 0;
  extension.startAt = null;

  render();
}

function replyStart() {
  if (reply.running || reply.remaining <= 0) return;

  reply.running = true;
  reply.endAt = now() + reply.remaining * 1000;
  startLoop();
}

function replyPause() {
  if (!reply.running) return;
  const t = now();
  reply.remaining = Math.max(0, (reply.endAt - t) / 1000);
  reply.running = false;
  reply.endAt = null;
  render();
}

function replyReset() {
  reply.running = false;
  reply.remaining = reply.duration;
  reply.endAt = null;
  render();
}

function poiStart() {
  if (poi.running || poi.remaining <= 0) return;

  poi.running = true;
  poi.endAt = now() + poi.remaining * 1000;
  startLoop();
}

function poiPause() {
  if (!poi.running) return;
  const t = now();
  poi.remaining = Math.max(0, (poi.endAt - t) / 1000);
  poi.running = false;
  poi.endAt = null;
  render();
}

function poiReset() {
  poi.running = false;
  poi.remaining = poi.duration;
  poi.endAt = null;
  render();
}

function extensionReset() {
  extension.running = false;
  extension.elapsed = 0;
  extension.startAt = null;
  render();
}

function startLoop() {
  if (frameId === null) frameId = requestAnimationFrame(tick);
}

function tick(t) {
  const current = t;

  if (speech.running) {
    speech.remaining = Math.max(0, (speech.endAt - current) / 1000);
   if (speech.remaining <= 0) {
     speech.remaining = 0;
     speech.running = false;
     speech.endAt = null;
    
     extension.running = true;
     extension.startAt = current;
   }

  }

  if (reply.running) {
    reply.remaining = Math.max(0, (reply.endAt - current) / 1000);
   if (reply.remaining <= 0) {
     reply.remaining = 0;
     reply.running = false;
     reply.endAt = null;

     extension.running = true;
     extension.startAt = current;
   }

  }

  if (poi.running) {
    poi.remaining = Math.max(0, (poi.endAt - current) / 1000);

    if (poi.remaining <= 0) {
      poi.remaining = 0;
      poi.running = false;
      poi.endAt = null;
    }
  }

  if (extension.running) {
    extension.elapsed = Math.max(0, (current - extension.startAt) / 1000);
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
    speech.endAt = null;

    extension.running = false;
    extension.elapsed = 0;
    extension.startAt = null;

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
    reply.endAt = null;

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
