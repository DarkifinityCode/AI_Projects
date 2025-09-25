const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const gestureSpan = document.getElementById('gesture');

let detector = null;
let stream = null;
let rafId = null;

// resize canvas
function resize() {
  overlay.width = video.videoWidth || video.clientWidth;
  overlay.height = video.videoHeight || video.clientHeight;
}

// draw hand keypoints
function drawHands(hands) {
  ctx.clearRect(0,0,overlay.width,overlay.height);
  hands.forEach(hand=>{
    hand.keypoints.forEach(kp=>{
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 5, 0, Math.PI*2);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
    });
  });
}

// dummy gesture classifier (replace with your trained model)
function classifyGesture(hands){
  if(hands.length===0) return 'None';
  // very simple rule: number of fingers extended
  const kp = hands[0].keypoints;
  const yCoords = kp.map(k=>k.y);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);
  const range = maxY - minY;
  if(range<100) return 'Fist';
  return 'Open';
}

// main loop
async function loop() {
  if(!detector) return;
  const hands = await detector.estimateHands(video);
  drawHands(hands);
  gestureSpan.innerText = classifyGesture(hands);
  rafId = requestAnimationFrame(loop);
}

// start camera
async function startCamera() {
  startBtn.disabled = true;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user' }, audio:false });
    video.srcObject = stream;
    await video.play();
    resize();
    stopBtn.disabled = false;

    if(!detector){
      detector = await handPoseDetection.createDetector(handPoseDetection.SupportedModels.MediaPipeHands, {
        runtime:'tfjs', maxHands:2
      });
    }
    loop();
  } catch(e){
    console.error(e);
    alert('Camera error: '+e.message);
    startBtn.disabled = false;
  }
}

// stop camera
function stopCamera() {
  startBtn.disabled = false;
  stopBtn.disabled = true;
  if(stream){
    stream.getTracks().forEach(t=>t.stop());
    stream=null;
  }
  if(rafId) cancelAnimationFrame(rafId);
  ctx.clearRect(0,0,overlay.width,overlay.height);
  gestureSpan.innerText='None';
}

startBtn.addEventListener('click', startCamera);
stopBtn.addEventListener('click', stopCamera);
window.addEventListener('resize', resize);
