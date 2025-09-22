// Crowd counting using coco-ssd (person class)
// - Webcam or uploaded video
// - Detection interval (ms) adjustable
// - Rolling average of last N counts
// - Optional heatmap (accumulate person center points)

const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const heatmapCanvas = document.getElementById('heatmapCanvas');
const ctx = overlay.getContext('2d');
const heatCtx = heatmapCanvas.getContext('2d');

const startWebcamBtn = document.getElementById('startWebcam');
const stopWebcamBtn = document.getElementById('stopWebcam');
const uploadInput = document.getElementById('videoUpload');
const intervalSlider = document.getElementById('interval');
const heatmapToggle = document.getElementById('heatmapToggle');
const snapshotBtn = document.getElementById('snapshot');

const currentCountEl = document.getElementById('currentCount');
const rollingAvgEl = document.getElementById('rollingAvg');
const totalDetectionsEl = document.getElementById('totalDetections');
const statusEl = document.getElementById('status');

let model = null;
let detectionInterval = parseInt(intervalSlider.value); // ms
let detectTimer = null;
let useHeatmap = false;
let isWebcam = false;
let webcamStream = null;

let countHistory = []; // last N counts
const ROLLING_WINDOW = 10;
let totalDetections = 0;

// heatmap accumulation grid (resolution relative to canvas)
const heatGrid = [];
const HEAT_W = 64;
const HEAT_H = 36;

// helper: resize overlay canvases to match video
function resizeCanvases() {
  const w = video.videoWidth || video.clientWidth || 640;
  const h = video.videoHeight || (w * 9 / 16);
  overlay.width = w;
  overlay.height = h;
  heatmapCanvas.width = w;
  heatmapCanvas.height = h;
}

// init heatGrid zeros
function resetHeatGrid() {
  heatGrid.length = 0;
  for (let y=0;y<HEAT_H;y++){
    heatGrid[y] = new Float32Array(HEAT_W);
  }
  // clear canvas
  heatCtx.clearRect(0,0,heatmapCanvas.width, heatmapCanvas.height);
}

// draw heatmap from heatGrid
function renderHeatmap() {
  const w = heatmapCanvas.width, h = heatmapCanvas.height;
  // create image data
  const img = heatCtx.createImageData(w, h);
  // map grid to image
  for (let gy=0; gy<HEAT_H; gy++){
    for (let gx=0; gx<HEAT_W; gx++){
      const intensity = heatGrid[gy][gx]; // floats
      if (intensity <= 0) continue;
      // compute pixel block coordinates
      const x0 = Math.floor((gx/HEAT_W) * w);
      const y0 = Math.floor((gy/HEAT_H) * h);
      const x1 = Math.floor(((gx+1)/HEAT_W) * w);
      const y1 = Math.floor(((gy+1)/HEAT_H) * h);
      // color mapping: from transparent -> red/yellow
      const alpha = Math.min(0.85, intensity * 0.12);
      const r = Math.min(255, Math.floor(255 * intensity));
      const g = Math.max(0, Math.floor(200 * (1 - intensity)));
      const b = Math.max(0, Math.floor(50 * (1 - intensity)));
      for (let py=y0; py<y1; py++){
        for (let px=x0; px<x1; px++){
          const idx = (py * w + px) * 4;
          img.data[idx] = Math.min(255, img.data[idx] + r * alpha);
          img.data[idx+1] = Math.min(255, img.data[idx+1] + g * alpha);
          img.data[idx+2] = Math.min(255, img.data[idx+2] + b * alpha);
          img.data[idx+3] = Math.min(200, img.data[idx+3] + Math.floor(255*alpha*0.6));
        }
      }
    }
  }
  heatCtx.putImageData(img, 0, 0);
  // add slight blur / fade
  heatCtx.globalCompositeOperation = 'destination-over';
  heatCtx.fillStyle = 'rgba(0,0,0,0.02)';
  heatCtx.fillRect(0,0,w,h);
  heatCtx.globalCompositeOperation = 'source-over';
}

// update rolling average UI
function updateStats(count) {
  countHistory.push(count);
  if (countHistory.length > ROLLING_WINDOW) countHistory.shift();
  const sum = countHistory.reduce((a,b)=>a+b, 0);
  const avg = sum / countHistory.length;
  currentCountEl.innerText = String(count);
  rollingAvgEl.innerText = avg.toFixed(1);
  totalDetectionsEl.innerText = String(totalDetections);
}

// draw detections
function drawDetections(detections) {
  ctx.clearRect(0,0,overlay.width, overlay.height);
  ctx.lineWidth = Math.max(2, overlay.width * 0.002);
  ctx.font = `${Math.max(12, Math.floor(overlay.width * 0.03))}px Arial`;
  ctx.textBaseline = 'top';
  detections.forEach(det => {
    if (det.class !== 'person') return;
    const [x, y, w, h] = det.bbox;
    // box
    ctx.strokeStyle = '#00FF99';
    ctx.strokeRect(x, y, w, h);
    // label
    const label = `${det.class} ${(det.score*100).toFixed(0)}%`;
    const textW = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x, y - 22, textW + 8, 20);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, x + 4, y - 20);

    // mark center on heatmap
    if (useHeatmap) {
      const cx = x + w/2;
      const cy = y + h/2;
      const gx = Math.floor((cx / overlay.width) * HEAT_W);
      const gy = Math.floor((cy / overlay.height) * HEAT_H);
      if (gx >=0 && gx < HEAT_W && gy >=0 && gy < HEAT_H) {
        heatGrid[gy][gx] += 1.0; // increment intensity
        totalDetections += 1;
      }
    } else {
      // still update total detections if not using heatmap
      totalDetections += 1;
    }
  });
  if (useHeatmap) renderHeatmap();
}

// perform detection on current video frame
async function detectFrame() {
  if (!model) return;
  if (video.readyState < 2) return; // not enough data yet
  // For performance: run detection on a downscaled temporary canvas
  // but coco-ssd accepts HTMLVideoElement directly, we'll pass video
  const predictions = await model.detect(video);
  // filter persons only & reasonable confidence threshold
  const persons = predictions.filter(p => p.class === 'person' && p.score > 0.45);
  drawDetections(persons);
  updateStats(persons.length);
}

// set periodic detection using interval (ms)
function startDetectionLoop() {
  if (detectTimer) clearInterval(detectTimer);
  detectTimer = setInterval(() => {
    detectFrame().catch(err => console.error(err));
  }, detectionInterval);
}

// stop detection loop
function stopDetectionLoop() {
  if (detectTimer) {
    clearInterval(detectTimer);
    detectTimer = null;
  }
}

/* ------- UI handlers ------- */

intervalSlider.addEventListener('input', (e) => {
  detectionInterval = parseInt(e.target.value);
  if (detectTimer) { startDetectionLoop(); }
  statusEl.innerText = `Detection every ${detectionInterval} ms`;
});

heatmapToggle.addEventListener('change', (e) => {
  useHeatmap = e.target.checked;
  if (!useHeatmap) {
    heatCtx.clearRect(0,0,heatmapCanvas.width, heatmapCanvas.height);
    resetHeatGrid();
  } else {
    resetHeatGrid();
  }
});

snapshotBtn.addEventListener('click', () => {
  // combine overlay + video into final image
  const tmp = document.createElement('canvas');
  tmp.width = overlay.width; tmp.height = overlay.height;
  const tctx = tmp.getContext('2d');
  tctx.drawImage(video, 0, 0, tmp.width, tmp.height);
  tctx.drawImage(overlay, 0, 0);
  const link = document.createElement('a');
  link.download = `crowd_snapshot_${Date.now()}.png`;
  link.href = tmp.toDataURL('image/png');
  link.click();
});

uploadInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  stopWebcam();
  const url = URL.createObjectURL(file);
  // if image file: show static image for counting
  if (file.type.startsWith('image/')) {
    video.srcObject = null;
    video.pause();
    video.removeAttribute('src');
    // use image in video element via blob as source; create object URL for <video> works too for images? We'll show in video by creating a single-frame video is complex — use <img> fallback.
    const img = new Image();
    img.src = url;
    img.onload = () => {
      // create a small video-like loop by drawing image to hidden video-sized area
      video.width = img.width; video.height = img.height;
      // draw image onto overlay and run one detection via canvas
      // create temporary canvas
      const tmp = document.createElement('canvas');
      tmp.width = img.width; tmp.height = img.height;
      const tmpCtx = tmp.getContext('2d');
      tmpCtx.drawImage(img, 0, 0);
      // draw tmp to video element by converting to blob url and set as poster
      video.src = url;
      video.onloadedmetadata = () => {
        resizeCanvases();
        detectFrame();
      };
    };
  } else {
    // video file
    video.src = url;
    video.onloadedmetadata = () => {
      resizeCanvases();
      video.play();
      startDetectionLoop();
    };
  }
});

/* Webcam controls */
startWebcamBtn.addEventListener('click', async () => {
  try {
    stopWebcam();
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    webcamStream = stream;
    video.srcObject = stream;
    await video.play();
    isWebcam = true;
    resizeCanvases();
    resetHeatGrid();
    startDetectionLoop();
    startWebcamBtn.disabled = true;
    stopWebcamBtn.disabled = false;
    statusEl.innerText = 'Webcam running — model ready';
  } catch (err) {
    alert('Camera error: ' + err.message);
  }
});

stopWebcamBtn.addEventListener('click', () => {
  stopWebcam();
});

function stopWebcam() {
  if (webcamStream) {
    webcamStream.getTracks().forEach(t => t.stop());
    webcamStream = null;
  }
  isWebcam = false;
  stopDetectionLoop();
  startWebcamBtn.disabled = false;
  stopWebcamBtn.disabled = true;
}

/* ------- Model load & startup ------- */

async function init() {
  statusEl.innerText = 'Loading Coco-SSD model...';
  model = await cocoSsd.load(); // loads from CDN
  statusEl.innerText = 'Model loaded. Start webcam or upload video.';
  // default canvas sizing
  video.addEventListener('loadeddata', () => {
    resizeCanvases();
  });
  // ensure canvases sized on window resize
  window.addEventListener('resize', () => {
    resizeCanvases();
  });
  resetHeatGrid();
}

init();
