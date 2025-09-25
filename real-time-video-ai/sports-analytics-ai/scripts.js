const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');

let model = null;
let stream = null;
let rafId = null;

// resize canvas
function resize() {
  overlay.width = video.videoWidth || video.clientWidth;
  overlay.height = video.videoHeight || video.clientHeight;
}

// draw bounding boxes and paths
const trails = {}; // track movement history

function drawObjects(predictions) {
  ctx.clearRect(0,0,overlay.width, overlay.height);

  predictions.forEach(pred => {
    const [x, y, width, height] = pred.bbox;
    ctx.strokeStyle = pred.class === 'sports ball' ? '#ff0000' : '#00ff88';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = '#00ff88';
    ctx.font = '14px sans-serif';
    ctx.fillText(pred.class, x, y>10? y-5: y+12);

    // update trail
    const center = [x + width/2, y + height/2];
    if(!trails[pred.class]) trails[pred.class] = [];
    trails[pred.class].push(center);
    if(trails[pred.class].length>50) trails[pred.class].shift();

    // draw trail
    ctx.beginPath();
    ctx.strokeStyle = pred.class === 'sports ball' ? '#ff8888' : '#88ff88';
    ctx.lineWidth = 2;
    trails[pred.class].forEach((pos,i)=>{
      if(i===0) ctx.moveTo(pos[0], pos[1]);
      else ctx.lineTo(pos[0], pos[1]);
    });
    ctx.stroke();
  });
}

// main loop
async function loop() {
  if(!model) return;
  const predictions = await model.detect(video);
  drawObjects(predictions);
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

    if(!model){
      model = await cocoSsd.load();
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
  ctx.clearRect(0,0,overlay.width, overlay.height);
  for(let key in trails) trails[key]=[];
}

startBtn.addEventListener('click', startCamera);
stopBtn.addEventListener('click', stopCamera);
window.addEventListener('resize', resize);
