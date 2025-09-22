// ====== DOM ======
const fileInput   = document.getElementById('fileInput');
const useDemoBtn  = document.getElementById('useDemoBtn');
const trainBtn    = document.getElementById('trainBtn');
const forecastBtn = document.getElementById('forecastBtn');
const statusEl    = document.getElementById('status');
const progressEl  = document.getElementById('progress');
const windowEl    = document.getElementById('windowSize');
const epochsEl    = document.getElementById('epochs');
const horizonEl   = document.getElementById('horizon');
const splitEl     = document.getElementById('trainSplit');

let chart;

// ====== Data containers ======
let timestamps = [];  // Date objects or ms
let values     = [];  // numeric consumption
let stepMs     = null; // inferred sampling interval
let scaler     = null; // {min, max}

// ====== TF model ======
let model = null;
let trained = false;

// ====== Utils ======
function setStatus(text, kind = '') {
  statusEl.textContent = `Status: ${text}`;
  statusEl.style.color = kind === 'ok' ? '#22c55e' : kind === 'warn' ? '#f59e0b' : kind === 'err' ? '#ef4444' : '';
}
function showProgress(show) { progressEl.style.display = show ? 'block' : 'none'; }

// Simple CSV parser (timestamp,value)
function parseCSV(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const ts = [], vals = [];
  for (const line of lines) {
    const [tRaw, vRaw] = line.split(',').map(s => s.trim());
    if (!tRaw || !vRaw) continue;
    const v = parseFloat(vRaw);
    if (Number.isNaN(v)) continue;
    const t = isNaN(Date.parse(tRaw)) ? null : new Date(tRaw);
    ts.push(t ? t.getTime() : ts.length ? ts[ts.length - 1] + (ts.length > 1 ? (ts[1] - ts[0]) : 3600000) : Date.now());
    vals.push(v);
  }
  return { ts, vals };
}

function inferStepMs(ts) {
  if (ts.length < 2) return 3600000; // 1h default
  const diffs = [];
  for (let i = 1; i < ts.length; i++) diffs.push(ts[i] - ts[i - 1]);
  diffs.sort((a,b)=>a-b);
  return diffs[Math.floor(diffs.length/2)] || 3600000;
}

function fitScaler(arr) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  return {
    min, max,
    norm: x => (x - min) / (max - min || 1),
    denorm: y => y * (max - min || 1) + min
  };
}

// Create supervised windowed dataset
function makeWindows(series, windowSize) {
  const xs = [];
  const ys = [];
  for (let i = 0; i < series.length - windowSize; i++) {
    xs.push(series.slice(i, i + windowSize));
    ys.push(series[i + windowSize]);
  }
  const xTensor = tf.tensor(xs).reshape([xs.length, windowSize, 1]);
  const yTensor = tf.tensor(ys).reshape([ys.length, 1]);
  return { xTensor, yTensor };
}

function splitTensors(x, y, trainPct = 0.8) {
  const n = x.shape[0];
  const nTrain = Math.floor(n * (trainPct/100));
  const xTr = x.slice([0,0,0],[nTrain, x.shape[1], 1]);
  const yTr = y.slice([0,0],[nTrain, 1]);
  const xTe = x.slice([nTrain,0,0],[n - nTrain, x.shape[1], 1]);
  const yTe = y.slice([nTrain,0],[n - nTrain, 1]);
  return { xTr, yTr, xTe, yTe };
}

function buildModel(windowSize) {
  const m = tf.sequential();
  m.add(tf.layers.lstm({ units: 32, inputShape: [windowSize, 1], returnSequences: false }));
  m.add(tf.layers.dense({ units: 16, activation: 'relu' }));
  m.add(tf.layers.dense({ units: 1 }));
  m.compile({ optimizer: tf.train.adam(0.001), loss: 'mse' });
  return m;
}

function drawChart(historyTs, historyVals, forecastTs = [], forecastVals = []) {
  if (chart) chart.destroy();
  const ctx = document.getElementById('chart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [...historyTs.map(t => new Date(t).toLocaleString()), ...forecastTs.map(t => new Date(t).toLocaleString())],
      datasets: [
        {
          label: 'History',
          data: historyVals,
          borderColor: '#3b82f6',
          pointRadius: 0,
          tension: 0.2
        },
        {
          label: 'Forecast',
          data: [...Array(historyVals.length - 1).fill(null), ...forecastVals],
          borderColor: '#22c55e',
          pointRadius: 0,
          borderDash: [6,4],
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top' } },
      scales: {
        x: { ticks: { maxRotation: 0, autoSkip: true } },
        y: { title: { display: true, text: 'Consumption' } }
      }
    }
  });
}

// ====== Data loading ======
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const { ts, vals } = parseCSV(text);
  if (ts.length < 60) {
    setStatus('Need at least ~60 rows for a decent demo.', 'warn');
  } else {
    setStatus(`Loaded ${ts.length} rows from CSV`, 'ok');
  }
  timestamps = ts;
  values = vals;
  stepMs = inferStepMs(timestamps);
  trained = false;
  forecastBtn.disabled = true;
  drawChart(timestamps, values);
});

useDemoBtn.addEventListener('click', () => {
  // Create synthetic daily-cycle + weekly pattern + noise
  const n = 24*30; // 30 days hourly
  const start = Date.now() - n * 3600000;
  const ts = Array.from({length:n}, (_,i)=> start + i*3600000);
  const vals = ts.map((_,i)=>{
    const hour = i % 24;
    const day = Math.floor(i/24) % 7;
    const base = 100 + 30*Math.sin((2*Math.PI*hour)/24); // daily
    const weekly = 10*Math.sin((2*Math.PI*day)/7);       // weekly
    const noise = 8*(Math.random()-0.5);
    return Math.max(20, base + weekly + noise);
  });
  timestamps = ts;
  values = vals;
  stepMs = 3600000;
  trained = false;
  forecastBtn.disabled = true;
  setStatus(`Demo data ready: ${n} hourly points`, 'ok');
  drawChart(timestamps, values);
});

// ====== Training ======
trainBtn.addEventListener('click', async () => {
  if (!values.length) {
    setStatus('Load CSV or use demo data first.', 'warn');
    return;
  }
  const windowSize = Math.max(4, parseInt(windowEl.value)||48);
  const epochs = Math.max(1, parseInt(epochsEl.value)||20);
  const trainPct = Math.min(95, Math.max(50, parseInt(splitEl.value)||80));

  // Normalize
  scaler = fitScaler(values);
  const series = values.map(v => scaler.norm(v));

  // Windows
  const { xTensor, yTensor } = makeWindows(series, windowSize);
  if (xTensor.shape[0] < 10) {
    setStatus('Not enough data after windowing. Reduce window size or add more rows.', 'err');
    xTensor.dispose(); yTensor.dispose();
    return;
  }
  const { xTr, yTr, xTe, yTe } = splitTensors(xTensor, yTensor, trainPct);
  xTensor.dispose(); yTensor.dispose();

  model?.dispose();
  model = buildModel(windowSize);

  setStatus('Training…');
  showProgress(true);

  await model.fit(xTr, yTr, {
    epochs,
    batchSize: 32,
    validationData: [xTe, yTe],
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        progressEl.value = (epoch+1)/epochs;
        setStatus(`Training… epoch ${epoch+1}/${epochs} | loss ${logs.loss.toFixed(4)} val ${logs.val_loss.toFixed(4)}`);
        await tf.nextFrame();
      }
    }
  });

  xTr.dispose(); yTr.dispose(); xTe.dispose(); yTe.dispose();
  showProgress(false);
  setStatus('Training complete. You can forecast now.', 'ok');
  trained = true;
  forecastBtn.disabled = false;
});

// ====== Forecasting ======
forecastBtn.addEventListener('click', async () => {
  if (!trained || !model) {
    setStatus('Train the model first.', 'warn');
    return;
  }
  const windowSize = Math.max(4, parseInt(windowEl.value)||48);
  const horizon = Math.max(1, parseInt(horizonEl.value)||24);

  // Start with the last window from normalized series
  const series = values.map(v => scaler.norm(v));
  let windowArr = series.slice(series.length - windowSize);

  const forecasts = [];
  for (let i=0; i<horizon; i++) {
    const input = tf.tensor(windowArr).reshape([1, windowSize, 1]);
    const yhat = model.predict(input);
    const val = (await yhat.data())[0];
    input.dispose(); yhat.dispose();

    forecasts.push(val);
    windowArr = [...windowArr.slice(1), val];
    await tf.nextFrame();
  }

  const forecastVals = forecasts.map(v => scaler.denorm(v));
  const lastTs = timestamps[timestamps.length - 1];
  const fTs = Array.from({length:horizon}, (_,i)=> lastTs + (i+1)*stepMs);

  setStatus('Forecast complete.', 'ok');
  drawChart(timestamps, values, fTs, forecastVals);
});
