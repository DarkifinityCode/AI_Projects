const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const keywordEl = document.getElementById('keyword');

let recognizer = null;

// Load the pretrained keyword spotting model
async function loadModel(){
  recognizer = speechCommands.create('BROWSER_FFT');
  await recognizer.ensureModelLoaded();
  console.log('Keyword spotting model loaded!');
}
loadModel();

let listening = false;

startBtn.addEventListener('click', async ()=>{
  if(!recognizer) return alert('Model not loaded yet');

  statusEl.innerText = 'Status: Listening...';
  startBtn.disabled = true;
  stopBtn.disabled = false;
  listening = true;

  recognizer.listen(result=>{
    const scores = result.scores;
    const labels = recognizer.wordLabels();
    const maxIndex = scores.indexOf(Math.max(...scores));
    const detectedWord = labels[maxIndex];

    if(detectedWord !== '_background_'){
      keywordEl.innerText = detectedWord;
    }
  },{
    probabilityThreshold:0.9
  });
});

stopBtn.addEventListener('click', ()=>{
  recognizer.stopListening();
  statusEl.innerText = 'Status: Idle';
  startBtn.disabled = false;
  stopBtn.disabled = true;
  listening = false;
});
