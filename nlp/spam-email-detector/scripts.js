const analyzeBtn = document.getElementById('analyzeBtn');
const emailInput = document.getElementById('emailInput');
const classificationEl = document.getElementById('classification');

let model = null;
let labels = ["Not Spam","Spam"]; // optional: load from labels.json

// Load pretrained spam detection model
async function loadModel(){
  model = await tf.loadLayersModel('model.json'); // place model.json in folder
  console.log('Spam email detection model loaded!');
}
loadModel();

analyzeBtn.addEventListener('click', async () => {
  const text = emailInput.value.trim();
  if(!text) return alert("Please enter email content.");

  const inputTensor = preprocessText(text); // convert text to model input
  const prediction = model.predict(inputTensor);
  const predIndex = prediction.argMax(-1).dataSync()[0];

  classificationEl.innerText = labels[predIndex];
});

// Example preprocessing function (adjust to your model)
function preprocessText(text){
  // Tokenization/padding must match model training
  const maxLen = 100;
  let seq = text.split(' ').map(w => w.length % 100); // dummy encoding for demo
  if(seq.length < maxLen) seq = seq.concat(Array(maxLen - seq.length).fill(0));
  else seq = seq.slice(0,maxLen);
  return tf.tensor([seq]);
}
