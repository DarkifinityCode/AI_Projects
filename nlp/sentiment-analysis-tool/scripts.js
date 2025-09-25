const analyzeBtn = document.getElementById('analyzeBtn');
const textInput = document.getElementById('textInput');
const sentimentEl = document.getElementById('sentiment');

let model = null;
let labels = ["Negative","Neutral","Positive"]; // optional: load from labels.json

// Load pretrained sentiment model
async function loadModel(){
  model = await tf.loadLayersModel('model.json'); // place model.json in folder
  console.log('Sentiment analysis model loaded!');
}
loadModel();

analyzeBtn.addEventListener('click', async () => {
  const text = textInput.value.trim();
  if(!text) return alert("Please enter text.");

  const inputTensor = preprocessText(text); // convert text to model input
  const prediction = model.predict(inputTensor);
  const predIndex = prediction.argMax(-1).dataSync()[0];

  sentimentEl.innerText = labels[predIndex];
});

// Example preprocessing function (adjust to your model)
function preprocessText(text){
  // Tokenization and padding must match model training
  const maxLen = 100;
  let seq = text.split(' ').map(w => w.length % 100); // dummy encoding for demo
  if(seq.length < maxLen) seq = seq.concat(Array(maxLen - seq.length).fill(0));
  else seq = seq.slice(0,maxLen);
  return tf.tensor([seq]);
}
