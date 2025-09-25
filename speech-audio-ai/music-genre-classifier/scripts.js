const audioFile = document.getElementById('audioFile');
const predictBtn = document.getElementById('predictBtn');
const audioPlayer = document.getElementById('audioPlayer');
const genreSpan = document.getElementById('genre');

let model = null;

// Load model on page load
async function loadModel(){
  model = await tf.loadLayersModel('model.json'); // ensure model.json is in same folder
  console.log('Model loaded!');
}
loadModel();

// Enable predict button after file selection
audioFile.addEventListener('change',()=>{
  if(audioFile.files.length>0){
    predictBtn.disabled = false;
    const fileURL = URL.createObjectURL(audioFile.files[0]);
    audioPlayer.src = fileURL;
  }
});

// Predict genre
predictBtn.addEventListener('click', async ()=>{
  if(!model) return alert('Model not loaded yet');

  const file = audioFile.files[0];
  if(!file) return;

  // Convert audio to tensor (simplest approach: raw waveform or MFCC)
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const rawData = audioBuffer.getChannelData(0); // mono channel
  const input = tf.tensor(rawData.slice(0,16000)); // take first 16000 samples
  const inputReshaped = input.reshape([1, 16000, 1]); // shape as model expects

  const prediction = model.predict(inputReshaped);
  const predictedIndex = prediction.argMax(-1).dataSync()[0];

  // Example genres — adjust according to your trained model
  const genres = ['Classical','Jazz','Pop','Rock','HipHop','Electronic'];
  genreSpan.innerText = genres[predictedIndex];
});
