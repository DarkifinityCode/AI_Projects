const analyzeBtn = document.getElementById('analyzeBtn');
const textInput = document.getElementById('textInput');
const resultDiv = document.getElementById('result');

let model = null;

// Load TensorFlow.js model
async function loadModel(){
  model = await tf.loadLayersModel('model.json'); // keep model.json + weights in same folder
  console.log("Toxic comment detection model loaded!");
}
loadModel();

analyzeBtn.addEventListener('click', async () => {
  const text = textInput.value.trim();
  if(!text) return alert("Please enter a comment.");

  // Preprocess text -> token indices (example demo encoding)
  const inputTensor = preprocess(text);

  // Run model prediction
  const prediction = model.predict(inputTensor);
  const score = prediction.dataSync()[0]; // toxic probability

  // Show result
  if(score > 0.5){
    resultDiv.innerHTML = `⚠️ This comment looks <span class="toxic">Toxic</span> (score: ${(score*100).toFixed(1)}%)`;
  } else {
    resultDiv.innerHTML = `✅ This comment looks <span class="safe">Safe</span> (score: ${(score*100).toFixed(1)}%)`;
  }
});

// Dummy preprocessing for demo (replace with real tokenizer)
function preprocess(text){
  const maxLen = 200;
  let seq = text.split(" ").map(w => w.length % 100); // fake encoding
  if(seq.length < maxLen) seq = seq.concat(Array(maxLen - seq.length).fill(0));
  else seq = seq.slice(0, maxLen);
  return tf.tensor([seq]);
}
