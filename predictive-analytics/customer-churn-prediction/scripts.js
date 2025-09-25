let model;

async function createModel() {
  model = tf.sequential();

  model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [4] }));
  model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });

  // Mock training data (in real projects load dataset)
  const xs = tf.tensor2d([
    [70, 2, 0, 5],  // High charges, short tenure, month-to-month, many support calls → churn
    [20, 24, 2, 1], // Low charges, long tenure, two-year, few calls → no churn
    [50, 6, 0, 4],  // Medium usage, short tenure → churn
    [30, 36, 1, 2]  // Stable user → no churn
  ]);

  const ys = tf.tensor2d([
    [1], [0], [1], [0] // Labels: churn(1) or not(0)
  ]);

  await model.fit(xs, ys, { epochs: 100 });
  console.log("Model trained!");
}

async function predictChurn(inputData) {
  const inputTensor = tf.tensor2d([inputData]);
  const prediction = model.predict(inputTensor);
  const prob = (await prediction.data())[0];
  return prob;
}

document.getElementById("churnForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const monthlyCharges = parseFloat(document.getElementById("monthlyCharges").value);
  const tenure = parseFloat(document.getElementById("tenure").value);
  const contract = parseInt(document.getElementById("contract").value);
  const supportCalls = parseFloat(document.getElementById("supportCalls").value);

  const probability = await predictChurn([monthlyCharges, tenure, contract, supportCalls]);

  document.getElementById("result").innerText =
    probability > 0.5
      ? `⚠️ High Risk of Churn (Probability: ${(probability*100).toFixed(2)}%)`
      : `✅ Customer Likely to Stay (Probability: ${(probability*100).toFixed(2)}%)`;
});

createModel();
