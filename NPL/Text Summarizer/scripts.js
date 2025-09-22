const summarizeBtn = document.getElementById('summarizeBtn');
const textInput = document.getElementById('textInput');
const summaryOutput = document.getElementById('summaryOutput');

let model = null;

// Load pretrained summarization model
async function loadModel(){
  model = await tf.loadLayersModel('model.json'); // place model.json in folder
  console.log('Text summarizer model loaded!');
}
loadModel();

summarizeBtn.addEventListener('click', async () => {
  const text = textInput.value.trim();
  if(!text) return alert("Please enter text.");

  const inputTensor = preprocessText(text); // convert text to model input
  const prediction = model.predict(inputTensor);

  const summary = postprocessPrediction(prediction);
  summaryOutput.innerText = summary;
});

// Example preprocessing function (adjust to your model)
function preprocessText(text){
  // Convert words to token indices or character IDs as used during model training
  const maxLen = 200;
  let seq = text.split(' ').map(w => w.length % 100); // dummy encoding for demo
  if(seq.length < maxLen) seq = seq.concat(Array(maxLen - seq.length).fill(0));
  else seq = seq.slice(0,maxLen);
  return tf.tensor([seq]);
}

// Example postprocessing (convert model output to text)
function postprocessPrediction(pred){
  // For demo, return dummy shortened text; replace with actual decoding
  return "Summary will appear here after model decoding.";
}
