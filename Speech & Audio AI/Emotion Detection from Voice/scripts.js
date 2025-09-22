const audioFile = document.getElementById('audioFile');
const predictBtn = document.getElementById('predictBtn');
const audioPlayer = document.getElementById('audioPlayer');
const emotionSpan = document.getElementById('emotion');

let model = null;

// Load pretrained model
async function loadModel(){
  model = await tf.loadLayersModel('model.json'); // ensure model.json is in same folder
  console.log('Emotion detection model loaded!');
}
loadModel();

// Enable button after file selection
audioFile.addEventListener('change',()=>{
  if(audioFile.files.length>0){
    predictBtn.disabled = false;
    const fileURL = URL.createObjectURL(audioFile.files[0]);
    audioPlayer.src = fileURL;
  }
});

// Predict emotion
predictBtn.addEventListener('click', async ()=>{
  if(!model) return alert('Model not loaded yet');

  const file = audioFile.files[0];
  if(!file) return;

  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const channelData = audioBuffer.getChannelData(0);

  // Take first N samples and reshape to model input
  const inputTensor = tf.tensor(channelData.slice(0,16000)).reshape([1,16000,1]);

  const prediction = model.predict(inputTensor);
  const predictedIndex = prediction.argMax(-1).dataSync()[0];

  // Example emotions — match with your trained model labels
  const emotions = ['Neutral','Happy','Sad','Angry','Fear','Disgust','Surprise'];
  emotionSpan.innerText = emotions[predictedIndex];
});
