const upload = document.getElementById('upload');
const checkBtn = document.getElementById('checkBtn');
const inputImg = document.getElementById('inputImg');
const canvas = document.getElementById('reconCanvas');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

let model;
const threshold = 0.1; // Adjust to tune sensitivity

upload.addEventListener('change', async () => {
  const file = upload.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  inputImg.src = url;
  inputImg.onload = async () => {
    canvas.width = inputImg.naturalWidth;
    canvas.height = inputImg.naturalHeight;
    checkBtn.disabled = false;
    status.innerText = 'Ready to check for defects!';
  };
});

checkBtn.addEventListener('click', async () => {
  checkBtn.disabled = true;
  status.innerText = 'Loading model...';
  if (!model) {
    model = await tf.loadGraphModel('./models/autoencoder/model.json');
  }
  status.innerText = 'Analyzing...';

  const imgTensor = tf.browser.fromPixels(inputImg)
    .resizeNearestNeighbor([128, 128])   // assume model input size
    .toFloat()
    .div(255)
    .expandDims();

  const recon = model.predict(imgTensor);
  const reconImage = recon.squeeze();

  // display reconstruction
  const resizedRecon = tf.image.resizeNearestNeighbor(reconImage, [inputImg.naturalHeight, inputImg.naturalWidth]);
  await tf.browser.toPixels(resizedRecon, canvas);

  // compute reconstruction error (mean squared)
  const errMap = tf.sub(imgTensor.squeeze(), resizedRecon).square();
  const mse = errMap.mean().dataSync()[0];

  status.innerText = (mse > threshold)
    ? `Defect detected! (Error: ${mse.toFixed(3)})`
    : `No defect. (Error: ${mse.toFixed(3)})`;

  imgTensor.dispose();
  recon.dispose();
  reconImage.dispose();
  resizedRecon.dispose();
  errMap.dispose();
});
