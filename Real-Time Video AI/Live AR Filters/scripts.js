const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const filterSelect = document.getElementById('filterSelect');

let model = null;
let stream = null;
let rafId = null;

// preload filter images
const filters = {
  glasses: new Image(),
  hat: new Image(),
  mask: new Image()
};
filters.glasses.src = 'glasses.png';
filters.hat.src = 'hat.png';
filters.mask.src = 'mask.png';

// resize canvas to video size
function resize() {
  overlay.width = video.videoWidth || video.clientWidth;
  overlay.height = video.videoHeight || video.clientHeight;
}

// draw filter on face based on keypoints
function drawFilter(predictions) {
  ctx.clearRect(0,0,overlay.width, overlay.height);
  if(predictions.length===0) return;
  const keypoints = predictions[0].scaledMesh;

  // example for glasses: place between eyes
  const leftEye = keypoints[33];  // left
  const rightEye = keypoints[263]; // right
  const nose = keypoints[168];

  const filter = filters[filterSelect.value];
  if(!filter.complete) return;

  const width = Math.hypot(rightEye[0]-leftEye[0], rightEye[1]-leftEye[1])*2;
  const height = width * (filter.height/filter.width);

  const x = leftEye[0] - width*0.25;
  const y = nose[1] - height*0.5;

  ctx.drawImage(filter, x, y, width, height);
}

// main loop
async function loop() {
  if(!model) return;
  resize();
  const predictions = await model.estimateFaces({input:video});
  drawFilter(predictions);
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

    if(!model) {
      model = await faceLandmarksDetection.load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh);
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
}

startBtn.addEventListener('click', startCamera);
stopBtn.addEventListener('click', stopCamera);
window.addEventListener('resize', resize);
