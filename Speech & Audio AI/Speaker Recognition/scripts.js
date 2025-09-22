const recordBtn = document.getElementById('recordBtn');
const predictBtn = document.getElementById('predictBtn');
const resetBtn = document.getElementById('resetBtn');
const statusEl = document.getElementById('status');
const audioPlayer = document.getElementById('audioPlayer');
const speakerEl = document.getElementById('speaker');

let model = null;
let audioBlob = null;
let mediaRecorder = null;
let audioChunks = [];

// Load pretrained speaker recognition model
async function loadModel(){
  model = await tf.loadLayersModel('model.json'); // place model.json in folder
  console.log('Speaker recognition model loaded!');
}
loadModel();

// Record audio
recordBtn.addEventListener('click', async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];
  mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
  mediaRecorder.onstop = e => {
    audioBlob = new Blob(audioChunks, { type:'audio/wav' });
    const audioURL = URL.createObjectURL(audioBlob);
    audioPlayer.src = audioURL;
    predictBtn.disabled = false;
  };
  mediaRecorder.start();
  statusEl.innerText = 'Status: Recording...';
  recordBtn.disabled = true;
});

// Stop recording after 3 seconds
recordBtn.addEventListener('click', ()=>{
  setTimeout(()=>{
    mediaRecorder.stop();
    statusEl.innerText = 'Status: Recording stopped';
    recordBtn.disabled = false;
  },3000);
});

// Predict speaker
predictBtn.addEventListener('click', async () => {
  if(!audioBlob || !model) return;
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const channelData = audioBuffer.getChannelData(0);

  // Adjust to match model input shape
  const inputTensor = tf.tensor(channelData.slice(0,16000)).reshape([1,16000,1]);
  const prediction = model.predict(inputTensor);
  const predictedIndex = prediction.argMax(-1).dataSync()[0];

  // Match with your trained speaker labels
  const speakers = ['Alice','Bob','Charlie']; // replace with actual speaker names
  speakerEl.innerText = speakers[predictedIndex];
});

// Reset
resetBtn.addEventListener('click', ()=>{
  audioPlayer.src = '';
  speakerEl.innerText = 'None';
  predictBtn.disabled = true;
  statusEl.innerText = 'Status: Idle';
});
