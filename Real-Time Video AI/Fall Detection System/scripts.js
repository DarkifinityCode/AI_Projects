// Fall detection using MoveNet (Pose Detection) with TFJS
// Heuristic: sudden large downward velocity of torso center + torso becomes near-horizontal
// Adjustable sensitivity and alert hold time
//
// Drop alert.mp3 in the same folder (or browser will silently fail to play if missing).

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');

const stateEl = document.getElementById('state');
const velEl = document.getElementById('vel');
const angleEl = document.getElementById('angle');
const alertBanner = document.getElementById('alertBanner');
const alarmSound = document.getElementById('alarmSound');

const sensitivitySlider = document.getElementById('sensitivity');
const alertHoldInput = document.getElementById('alertHold');

let detector = null;
let stream = null;
let rafId = null;

// temporal buffers
const HISTORY = 10; // frames
let torsoYs = [];   // normalized center y positions (0..1)
let timestamps = []; // Date.now()
let torsoAngles = []; // degrees
let alerted = false;
let alertTimeout = null;

// parameters (will be scaled by sensitivity)
function getParams() {
  const sens = Number(sensitivitySlider.value); // 1..10
  return {
    downwardVelocityThreshold: 0.5 * (sens/5), // normalized units per second (tune)
    horizontalAngleThreshold: 45, // degrees: torso angle relative to vertical; >45 means more horizontal
    sustainedFrames: Math.max(3, Math.round(4 - sens/3)), // fewer frames required at higher sensitivity
  };
}

function setState(s) { stateEl.innerText = s; }

// draw keypoints + skeleton
function drawPose(pose) {
  const keypoints = pose.keypoints;
  ctx.clearRect(0,0,overlay.width, overlay.height);
  ctx.lineWidth = Math.max(2, overlay.width * 0.0025);
  // draw skeleton
  const drawKey = (kp) => {
    if (kp.score > 0.35) {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, Math.max(3, overlay.width*0.008), 0, 2*Math.PI);
      ctx.fillStyle = '#00ff88';
      ctx.fill();
    }
  };
  keypoints.forEach(drawKey);
  // draw connections (pairs)
  const pairs = [
    ['left_shoulder','right_shoulder'],
    ['left_hip','right_hip'],
    ['left_shoulder','left_hip'],
    ['right_shoulder','right_hip']
  ];
  const nameToKp = {};
  keypoints.forEach(k=>nameToKp[k.name || k.part] = k);
  ctx.strokeStyle = 'rgba(0,255,136,0.9)';
  pairs.forEach(pair => {
    const a = nameToKp[pair[0]], b = nameToKp[pair[1]];
    if (a && b && a.score>0.35 && b.score>0.35) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  });
}

// compute torso center and torso angle
function computeTorsoMetrics(keypoints) {
  // Use shoulders and hips
  const kp = {};
  keypoints.forEach(k=> kp[k.name || k.part] = k);
  const leftShoulder = kp.left_shoulder || kp['left_shoulder'];
  const rightShoulder = kp.right_shoulder || kp['right_shoulder'];
  const leftHip = kp.left_hip || kp['left_hip'];
  const rightHip = kp.right_hip || kp['right_hip'];

  if (![leftShoulder,rightShoulder,leftHip,rightHip].every(Boolean)) return null;

  // centerX/Y average of shoulders+hips
  const cx = (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4;
  const cy = (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4;

  // torso vector: shoulders midpoint -> hips midpoint
  const shouldersMid = { x: (leftShoulder.x + rightShoulder.x)/2, y: (leftShoulder.y + rightShoulder.y)/2 };
  const hipsMid = { x: (leftHip.x + rightHip.x)/2, y: (leftHip.y + rightHip.y)/2 };

  const dx = hipsMid.x - shouldersMid.x;
  const dy = hipsMid.y - shouldersMid.y;
  const angleRad = Math.atan2(dy, dx); // angle relative to horizontal axis
  // Convert to angle relative to vertical: 90 - abs(angleDeg)
  const angleDeg = Math.abs(angleRad * 180 / Math.PI);
  // We'll compute torso angle relative to vertical by: verticalAngle = 90 - angleDegAbsolute
  const verticalAngle = Math.abs(90 - angleDeg); // near 0 = vertical, near 90 = horizontal
  // For easier interpretation: horizontalness = angleDegNearHorizontal = 90 - verticalAngle? simpler: take angle from shoulders->hips w.r.t vertical:
  const torsoAngleFromVertical = Math.abs(Math.atan2(dx, dy) * 180 / Math.PI); // alternate compute

  return {
    center: { x: cx, y: cy },
    torsoAngle: torsoAngleFromVertical // degrees where 0 = vertical, 90 = horizontal
  };
}

// maintain buffers and compute velocity (normalized by height)
function pushFrame(yNorm, angleDeg, tNow) {
  torsoYs.push(yNorm);
  torsoAngles.push(angleDeg);
  timestamps.push(tNow);
  if (torsoYs.length > HISTORY) {
    torsoYs.shift(); torsoAngles.shift(); timestamps.shift();
  }
}

// compute downward velocity (positive = moving downwards) in normalized units per second
function computeDownwardVelocity() {
  if (torsoYs.length < 2) return 0;
  const last = torsoYs.length - 1;
  const dt = (timestamps[last] - timestamps[0]) / 1000;
  if (dt <= 0) return 0;
  const dy = torsoYs[last] - torsoYs[0]; // positive if center moved downward (in pixels normalized)
  return dy / dt;
}

// heuristic fall detection
function detectFall() {
  const params = getParams();
  const vel = computeDownwardVelocity();
  const recentAngle = torsoAngles[torsoAngles.length - 1] || 0;
  // update UI numbers
  velEl.innerText = vel.toFixed(3);
  angleEl.innerText = `${recentAngle.toFixed(0)}°`;

  // Condition A: large downward velocity + torso becomes horizontal (angle high)
  if (vel > params.downwardVelocityThreshold && recentAngle > params.horizontalAngleThreshold) {
    return true;
  }
  // Condition B: sustained horizontal low position (maybe person lying)
  // Check if last N frames torso angle > threshold and center y is near bottom ( > 0.7 normalized)
  const sustained = torsoAngles.slice(-params.sustainedFrames).every(a => a > params.horizontalAngleThreshold);
  const lastY = torsoYs[torsoYs.length - 1] || 0;
  if (sustained && lastY > 0.6) return true;

  return false;
}

async function initDetector() {
  setState('loading model...');
  // create MoveNet single-pose detector (lightning) for speed
  const model = poseDetection.SupportedModels.MoveNet;
  const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
  detector = await poseDetection.createDetector(model, detectorConfig);
  setState('model loaded');
}

// resize overlay to video size
function resize() {
  overlay.width = video.videoWidth || video.clientWidth;
  overlay.height = video.videoHeight || video.clientHeight;
}

// main loop
async function loop() {
  if (!detector) return;
  if (video.readyState < 2) {
    rafId = requestAnimationFrame(loop);
    return;
  }
  resize();
  try {
    const poses = await detector.estimatePoses(video, { maxPoses: 1, flipHorizontal: false });
    if (poses && poses.length > 0) {
      const pose = poses[0];
      drawPose(pose);
      const metrics = computeTorsoMetrics(pose.keypoints);
      if (metrics) {
        // normalize center y by overlay height
        const yNorm = metrics.center.y / overlay.height;
        const angle = metrics.torsoAngle;
        pushFrame(yNorm, angle, Date.now());

        if (torsoYs.length >= 3) {
          if (!alerted && detectFall()) {
            triggerAlert();
          }
        }
        // if alerted and person recovers, auto-clear after alertHold
      }
    }
  } catch (err) {
    console.error('Pose error', err);
  }

  rafId = requestAnimationFrame(loop);
}

// Alert handling
function triggerAlert() {
  alerted = true;
  setState('FALL DETECTED');
  alertBanner.classList.remove('hidden');
  // play alarm if available (some browsers require user gesture; start button provides that)
  try { alarmSound.currentTime = 0; alarmSound.play().catch(()=>{}); } catch(e) {}
  const hold = Number(alertHoldInput.value) || 6;
  if (alertTimeout) clearTimeout(alertTimeout);
  alertTimeout = setTimeout(() => {
    clearAlert();
  }, hold * 1000);
}

function clearAlert() {
  alerted = false;
  setState('monitoring');
  alertBanner.classList.add('hidden');
  try { alarmSound.pause(); alarmSound.currentTime = 0; } catch(e){}
}

// camera start/stop
async function startCamera() {
  startBtn.disabled = true;
  setState('starting camera...');
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    video.srcObject = stream;
    await video.play();
    resize();
    setState('initializing model...');
    if (!detector) await initDetector();
    setState('monitoring');
    rafId = requestAnimationFrame(loop);
    stopBtn.disabled = false;
  } catch (err) {
    console.error(err);
    alert('Camera error: ' + err.message);
    startBtn.disabled = false;
  }
}

function stopCamera() {
  startBtn.disabled = false;
  stopBtn.disabled = true;
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  if (rafId) cancelAnimationFrame(rafId);
  detector = detector; // keep model loaded to avoid reload
  setState('idle');
  ctx.clearRect(0,0,overlay.width, overlay.height);
  torsoYs = []; torsoAngles = []; timestamps = [];
  clearAlert();
}

// UI wiring
startBtn.addEventListener('click', async () => {
  // user gesture ensures audio can play later
  await startCamera();
});
stopBtn.addEventListener('click', () => stopCamera());

// ensure canvas resizes on window change
window.addEventListener('resize', resize);

// try to autoplay a tiny silent sound to get audio permission in some browsers (best-effort)
(async function warmAudio() {
  try {
    await alarmSound.play();
    alarmSound.pause();
    alarmSound.currentTime = 0;
  } catch(e) {}
})();
