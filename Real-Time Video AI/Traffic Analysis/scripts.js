const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');

const carCountEl = document.getElementById('carCount');
const truckCountEl = document.getElementById('truckCount');
const busCountEl = document.getElementById('busCount');
const motorCountEl = document.getElementById('motorCount');

let model = null;
let stream = null;
let rafId = null;

// vehicle counters
let counts = { car:0, truck:0, bus:0, motorcycle:0 };

// resize canvas
function resize() {
  overlay.width = video.videoWidth || video.clientWidth;
  overlay.height = video.videoHeight || video.clientHeight;
}

// draw vehicles and count if they cross a line
function drawVehicles(predictions){
  ctx.clearRect(0,0,overlay.width, overlay.height);
  const lineY = overlay.height * 0.8;
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0,lineY);
  ctx.lineTo(overlay.width,lineY);
  ctx.stroke();

  predictions.forEach(pred=>{
    const [x,y,width,height] = pred.bbox;
    if(['car','truck','bus','motorcycle'].includes(pred.class)){
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.strokeRect(x,y,width,height);
      ctx.fillStyle = '#00ff88';
      ctx.font = '14px sans-serif';
      ctx.fillText(pred.class, x, y>10? y-5:y+12);

      // count vehicle if it crosses line
      const centerY = y + height/2;
      if(centerY > lineY && centerY < lineY+5){
        counts[pred.class]++;
      }
    }
  });

  // update UI
  carCountEl.innerText = counts.car;
  truckCountEl.innerText = counts.truck;
  busCountEl.innerText = counts.bus;
  motorCountEl.innerText = counts.motorcycle;
}

// main loop
async function loop(){
  if(!model) return;
  const predictions = await model.detect(video);
  drawVehicles(predictions);
  rafId = requestAnimationFrame(loop);
}

// start camera
async function startCamera(){
  startBtn.disabled = true;
  try{
    stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment' }, audio:false });
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
function stopCamera(){
  startBtn.disabled = false;
  stopBtn.disabled = true;
  if(stream){
    stream.getTracks().forEach(t=>t.stop());
    stream=null;
  }
  if(rafId) cancelAnimationFrame(rafId);
  ctx.clearRect(0,0,overlay.width, overlay.height);
  counts = { car:0, truck:0, bus:0, motorcycle:0 };
  carCountEl.innerText = 0;
  truckCountEl.innerText = 0;
  busCountEl.innerText = 0;
  motorCountEl.innerText = 0;
}

startBtn.addEventListener('click', startCamera);
stopBtn.addEventListener('click', stopCamera);
window.addEventListener('resize', resize);
