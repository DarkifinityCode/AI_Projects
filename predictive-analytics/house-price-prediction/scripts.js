let model;

// Load the pretrained model
async function loadModel() {
  model = await tf.loadLayersModel("https://storage.googleapis.com/tfjs-examples/multivariate-linear-regression/model.json");
  console.log("✅ Model loaded successfully");
}

loadModel();

document.getElementById("predictForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const rooms = parseFloat(document.getElementById("rooms").value);
  const sqft = parseFloat(document.getElementById("sqft").value);
  const location = parseFloat(document.getElementById("location").value);

  if (!model) {
    alert("Model is still loading, please wait!");
    return;
  }

  // Input: [rooms, sqft, location]
  const inputTensor = tf.tensor2d([[rooms, sqft, location]]);
  const prediction = model.predict(inputTensor);
  const predictedValue = (await prediction.data())[0];

  document.getElementById("output").innerText = 
    `Predicted Price: $${predictedValue.toFixed(2)}`;
});
