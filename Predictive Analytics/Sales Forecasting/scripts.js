let model;

// Load pretrained model
async function loadModel() {
  model = await tf.loadLayersModel("https://storage.googleapis.com/tfjs-examples/time-series-prediction/model.json");
  console.log("✅ Model loaded successfully");
}

loadModel();

document.getElementById("forecastForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const sales = [
    parseFloat(document.getElementById("m1").value),
    parseFloat(document.getElementById("m2").value),
    parseFloat(document.getElementById("m3").value),
    parseFloat(document.getElementById("m4").value),
    parseFloat(document.getElementById("m5").value),
    parseFloat(document.getElementById("m6").value),
  ];

  if (!model) {
    alert("Model is still loading, please wait!");
    return;
  }

  // Normalize input (simple scaling)
  const maxVal = Math.max(...sales);
  const normData = sales.map(v => v / maxVal);

  const inputTensor = tf.tensor2d([normData], [1, 6]);

  const prediction = model.predict(inputTensor);
  const predictedValue = (await prediction.data())[0] * maxVal; // de-normalize

  document.getElementById("output").innerText =
    `Predicted Sales: ${predictedValue.toFixed(2)}`;
});
