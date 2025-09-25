const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');

const lightBox = document.getElementById('light');
const menuBox = document.getElementById('menu');
const musicBox = document.getElementById('music');

let recognizer = null;

// Load speech-commands model
async function loadModel(){
  recognizer = speechCommands.create('BROWSER_FFT');
  await recognizer.ensureModelLoaded();
  console.log('Voice command model loaded!');
}
loadModel();

startBtn.addEventListener('click', () => {
  if(!recognizer) return alert('Model not loaded yet');

  statusEl.innerText = 'Status: Listening...';
  startBtn.disabled = true;
  stopBtn.disabled = false;

  recognizer.listen(result => {
    const scores = result.scores;
    const labels = recognizer.wordLabels();
    const maxIndex = scores.indexOf(Math.max(...scores));
    const detectedCommand = labels[maxIndex];

    if(detectedCommand !== '_background_'){
      handleCommand(detectedCommand);
    }
  },{
    probabilityThreshold:0.85
  });
});

stopBtn.addEventListener('click', ()=>{
  recognizer.stopListening();
  statusEl.innerText = 'Status: Idle';
  startBtn.disabled = false;
  stopBtn.disabled = true;
});

// Handle commands
function handleCommand(cmd){
  switch(cmd.toLowerCase()){
    case 'light on':
      lightBox.innerText = '💡 Light: ON';
      lightBox.style.background = '#22c55e';
      break;
    case 'light off':
      lightBox.innerText = '💡 Light: OFF';
      lightBox.style.background = '#14233c';
      break;
    case 'open menu':
      menuBox.innerText = '📂 Menu: Open';
      menuBox.style.background = '#22c55e';
      break;
    case 'close menu':
      menuBox.innerText = '📂 Menu: Closed';
      menuBox.style.background = '#14233c';
      break;
    case 'play music':
      musicBox.innerText = '🎵 Music: Playing';
      musicBox.style.background = '#22c55e';
      break;
    case 'pause music':
      musicBox.innerText = '🎵 Music: Paused';
      musicBox.style.background = '#14233c';
      break;
    default:
      console.log('Unknown command:', cmd);
  }
}
