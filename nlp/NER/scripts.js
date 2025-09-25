const analyzeBtn = document.getElementById('analyzeBtn');
const textInput = document.getElementById('textInput');
const output = document.getElementById('output');

let model = null;
let labels = ["O", "PER", "LOC", "ORG", "DATE"]; // optional: load from labels.json

// Load pretrained NER model
async function loadModel(){
  model = await tf.loadLayersModel('model.json'); // place model.json in folder
  console.log('NER model loaded!');
}
loadModel();

analyzeBtn.addEventListener('click', async () => {
  const text = textInput.value.trim();
  if(!text) return alert("Please enter text.");

  const tokens = text.split(' '); // simple tokenization
  const inputTensor = preprocessTokens(tokens); // convert to model input

  const predictions = model.predict(inputTensor); // [num_tokens, num_classes]
  const predIndices = predictions.argMax(-1).dataSync();

  displayEntities(tokens, predIndices);
});

// Example preprocessing function (adjust to your model)
function preprocessTokens(tokens){
  const maxLen = 50; // adjust based on model
  let seq = tokens.map(t => t.length % 100); // dummy encoding for demo
  if(seq.length < maxLen) seq = seq.concat(Array(maxLen - seq.length).fill(0));
  else seq = seq.slice(0,maxLen);
  return tf.tensor([seq]);
}

// Display detected entities
function displayEntities(tokens, predIndices){
  output.innerHTML = '';
  for(let i=0; i<tokens.length; i++){
    const token = tokens[i];
    const label = labels[predIndices[i]];
    const span = document.createElement('span');
    span.innerText = token + ' ';
    if(label !== 'O') span.className = 'entity-' + label;
    output.appendChild(span);
  }
}
