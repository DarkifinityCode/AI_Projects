let weatherData = [];
let chart;

// Read CSV
document.getElementById('fileInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const lines = e.target.result.split('\n').map(l => l.trim()).filter(l => l);
    weatherData = lines.map(Number).filter(n => !isNaN(n));
    document.getElementById("output").innerText = `Loaded ${weatherData.length} temperature records.`;
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
  if (weatherData.length < 10) {
    alert("Upload at least 10 weather data points!");
    return;
  }

  const {normalized, min, max} = normalizeData(weatherData);

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
  document.getElementById("output").innerText = "Model trained! Forecasting future weather...";

  // Predict next 7 days
  let inputSeq = normalized.slice(-5);
  let predictions = [];
  for (let i = 0; i < 7; i++) {
    const pred = model.predict(tf.tensor2d([inputSeq])).dataSync()[0];
    predictions.push(pred * (max - min) + min);
    inputSeq = inputSeq.slice(1).concat(pred);
  }

  renderChart(weatherData, predictions);
}

// Chart
function renderChart(realData, predictedData) {
  const labels = realData.map((_, i) => `Day ${i+1}`);
  const futureLabels = Array.from({length: predictedData.length}, (_, i) => `Day ${realData.length + i + 1}`);

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("chart"), {
    type: "line",
    data: {
      labels: labels.concat(futureLabels),
      datasets: [
        {
          label: "Observed Temperature",
          data: realData,
          borderColor: "orange",
          fill: false
        },
        {
          label: "Forecasted Temperature",
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
        x: {title: {display: true, text: "Days"}},
        y: {title: {display: true, text: "Temperature (°C)"}}
      }
    }
  });
}
