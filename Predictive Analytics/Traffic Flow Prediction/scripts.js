let trafficData = [];
let chart;

// Read CSV
document.getElementById('fileInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const lines = e.target.result.split('\n').map(l => l.trim()).filter(l => l);
    trafficData = lines.map(Number).filter(n => !isNaN(n));
    document.getElementById("output").innerText = `Loaded ${trafficData.length} data points.`;
  };
  reader.readAsText(file);
});

// Normalize values
function normalizeData(data) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const normalized = data.map(v => (v - min) / (max - min));
  return {normalized, min, max};
}

// Train Model
async function trainModel() {
  if (trafficData.length < 10) {
    alert("Upload at least 10 traffic data points!");
    return;
  }

  const {normalized, min, max} = normalizeData(trafficData);

  // Prepare training data (sequence of 5 -> predict next)
  const xs = [];
  const ys = [];
  for (let i = 0; i < normalized.length - 5; i++) {
    xs.push(normalized.slice(i, i + 5));
    ys.push(normalized[i + 5]);
  }

  const xsTensor = tf.tensor2d(xs);
  const ysTensor = tf.tensor2d(ys, [ys.length, 1]);

  // Build Model
  const model = tf.sequential();
  model.add(tf.layers.dense({units: 32, activation: 'relu', inputShape: [5]}));
  model.add(tf.layers.dense({units: 16, activation: 'relu'}));
  model.add(tf.layers.dense({units: 1}));

  model.compile({optimizer: 'adam', loss: 'meanSquaredError'});

  // Train
  document.getElementById("output").innerText = "Training model...";
  await model.fit(xsTensor, ysTensor, {epochs: 60, batchSize: 8});
  document.getElementById("output").innerText = "Model trained! Predicting future flow...";

  // Predict next 12 hours of traffic
  let inputSeq = normalized.slice(-5);
  let predictions = [];
  for (let i = 0; i < 12; i++) {
    const pred = model.predict(tf.tensor2d([inputSeq])).dataSync()[0];
    predictions.push(pred * (max - min) + min);
    inputSeq = inputSeq.slice(1).concat(pred);
  }

  renderChart(trafficData, predictions);
}

// Chart
function renderChart(realData, predictedData) {
  const labels = realData.map((_, i) => i + 1);
  const futureLabels = Array.from({length: predictedData.length}, (_, i) => realData.length + i + 1);

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("chart"), {
    type: "line",
    data: {
      labels: labels.concat(futureLabels),
      datasets: [
        {
          label: "Observed Traffic Flow",
          data: realData,
          borderColor: "blue",
          fill: false
        },
        {
          label: "Predicted Traffic Flow",
          data: Array(realData.length).fill(null).concat(predictedData),
          borderColor: "red",
          borderDash: [5, 5],
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {title: {display: true, text: "Time"}},
        y: {title: {display: true, text: "Vehicle Count"}}
      }
    }
  });
}
