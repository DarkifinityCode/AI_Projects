const predictBtn = document.getElementById('predictBtn');
const newsInput = document.getElementById('newsInput');
const predictionEl = document.getElementById('prediction');

let model = null;
let labels = ["Real","Fake"]; // optional: load from labels.json

async function loadModel(){
  model = await tf.loadLayersModel('model.json'); // place model.json in folder
  console.log('Fake news model loaded!');
}
loadModel();

predictBtn.addEventListener('click', async () => {
  const text = newsInput.value.trim();
  if(!text) return alert("Please enter news text.");

  // Simple preprocessing (tokenization/padding must match model training)
  const inputTensor = preprocessText(text);

  const prediction = model.predict(inputTensor);
  const predIndex = prediction.argMax(-1).dataSync()[0];
  predictionEl.innerText = labels[predIndex];
});

// Example preprocessing function (adapt to your trained model)
function preprocessText(text){
  // Convert string to sequence of integers (word indices)
  // This is placeholder; replace with actual tokenizer used during training
  const maxLen = 100; 
  let seq = text.split(' ').map(w=>w.length % 100); // dummy encoding
  if(seq.length < maxLen) seq = seq.concat(Array(maxLen - seq.length).fill(0));
  else seq = seq.slice(0,maxLen);
  return tf.tensor([seq]);
}
