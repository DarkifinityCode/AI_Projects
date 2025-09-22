const analyzeBtn = document.getElementById('analyzeBtn');
const reviewInput = document.getElementById('reviewInput');
const prosEl = document.getElementById('pros');
const consEl = document.getElementById('cons');

let model = null;
let labels = ["O","PRO","CON"]; // optional: load from labels.json

// Load pretrained model
async function loadModel(){
  model = await tf.loadLayersModel('model.json'); // place model.json in folder
  console.log('Product review model loaded!');
}
loadModel();

analyzeBtn.addEventListener('click', async () => {
  const text = reviewInput.value.trim();
  if(!text) return alert("Please enter a review.");

  const tokens = text.split(' '); // simple tokenization
  const inputTensor = preprocessTokens(tokens); // convert to model input

  const predictions = model.predict(inputTensor); // [num_tokens, num_classes]
  const predIndices = predictions.argMax(-1).dataSync();

  displayProsCons(tokens, predIndices);
});

// Example preprocessing function (adjust to your model)
function preprocessTokens(tokens){
  const maxLen = 50; // adjust based on model
  let seq = tokens.map(t => t.length % 100); // dummy encoding for demo
  if(seq.length < maxLen) seq = seq.concat(Array(maxLen - seq.length).fill(0));
  else seq = seq.slice(0,maxLen);
  return tf.tensor([seq]);
}

// Display extracted pros and cons
function displayProsCons(tokens, predIndices){
  let pros = [], cons = [];
  for(let i=0; i<tokens.length; i++){
    if(labels[predIndices[i]] === "PRO") pros.push(tokens[i]);
    if(labels[predIndices[i]] === "CON") cons.push(tokens[i]);
  }
  prosEl.innerText = pros.join(' ') || "None";
  consEl.innerText = cons.join(' ') || "None";
}
