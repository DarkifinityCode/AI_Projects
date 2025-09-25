const detectBtn = document.getElementById('detectBtn');
const textInput = document.getElementById('textInput');
const languageEl = document.getElementById('language');

let model = null;
let labels = ["English","Spanish","French","German","Italian","Portuguese","Chinese","Japanese"]; // or load from labels.json

// Load pretrained language detection model
async function loadModel(){
  model = await tf.loadLayersModel('model.json'); // place model.json in folder
  console.log('Language detection model loaded!');
}
loadModel();

detectBtn.addEventListener('click', async () => {
  const text = textInput.value.trim();
  if(!text) return alert("Please enter text.");

  const inputTensor = preprocessText(text); // convert text to model input
  const prediction = model.predict(inputTensor);
  const predIndex = prediction.argMax(-1).dataSync()[0];

  languageEl.innerText = labels[predIndex];
});

// Example preprocessing function (adjust to your model)
function preprocessText(text){
  // Character-level simple encoding for demo; replace with your tokenizer used during training
  const maxLen = 100;
  let seq = text.split('').map(c => c.charCodeAt(0) % 256);
  if(seq.length < maxLen) seq = seq.concat(Array(maxLen - seq.length).fill(0));
  else seq = seq.slice(0,maxLen);
  return tf.tensor([seq]);
}
