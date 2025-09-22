const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const originalEl = document.getElementById('original');
const translatedEl = document.getElementById('translated');
const targetLang = document.getElementById('targetLang');

let recognizer = null;
let listening = false;

// Load speech-commands model (simplified ASR demo)
async function loadModel(){
  recognizer = speechCommands.create('BROWSER_FFT');
  await recognizer.ensureModelLoaded();
  console.log('Speech recognition model loaded!');
}
loadModel();

startBtn.addEventListener('click', () => {
  if(!recognizer) return alert('Model not loaded yet');

  statusEl.innerText = 'Status: Listening...';
  startBtn.disabled = true;
  stopBtn.disabled = false;
  listening = true;

  recognizer.listen(async result => {
    const scores = result.scores;
    const labels = recognizer.wordLabels();
    const maxIndex = scores.indexOf(Math.max(...scores));
    const detectedWord = labels[maxIndex];

    if(detectedWord !== '_background_'){
      originalEl.innerText = detectedWord;

      // Translate text using free API (example using LibreTranslate)
      const response = await fetch('https://libretranslate.com/translate', {
        method:'POST',
        body: JSON.stringify({
          q: detectedWord,
          source: 'en',
          target: targetLang.value,
          format: 'text'
        }),
        headers:{'Content-Type':'application/json'}
      });
      const data = await response.json();
      translatedEl.innerText = data.translatedText;
    }
  },{
    probabilityThreshold:0.9
  });
});

stopBtn.addEventListener('click', () => {
  recognizer.stopListening();
  statusEl.innerText = 'Status: Idle';
  startBtn.disabled = false;
  stopBtn.disabled = true;
  listening = false;
});
