const audioFile = document.getElementById('audioFile');
const transcribeBtn = document.getElementById('transcribeBtn');
const audioPlayer = document.getElementById('audioPlayer');
const textSpan = document.getElementById('text');

let recognizer = null;

// Load speech-commands model
async function loadModel(){
  recognizer = speechCommands.create('BROWSER_FFT');
  await recognizer.ensureModelLoaded();
  console.log('Speech model loaded!');
}
loadModel();

// Enable button after file selection
audioFile.addEventListener('change',()=>{
  if(audioFile.files.length>0){
    transcribeBtn.disabled = false;
    const fileURL = URL.createObjectURL(audioFile.files[0]);
    audioPlayer.src = fileURL;
  }
});

// Transcribe audio
transcribeBtn.addEventListener('click', async ()=>{
  if(!recognizer) return alert('Model not loaded yet');

  const file = audioFile.files[0];
  if(!file) return;

  textSpan.innerText = 'Processing...';

  // Convert audio to Float32Array using Web Audio API
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const channelData = audioBuffer.getChannelData(0);

  // NOTE: This is a proof-of-concept. For real transcription, you need a full ASR model like Whisper WASM
  // Here, we just detect simple keywords (limited by speech-commands model)
  const input = tf.tensor(channelData.slice(0,16000)).reshape([1,16000,1]);
  const prediction = recognizer.predict(input);
  const scores = prediction.scores.dataSync();
  const labels = recognizer.wordLabels();

  const maxIndex = scores.indexOf(Math.max(...scores));
  textSpan.innerText = labels[maxIndex] || 'Unknown';
});
