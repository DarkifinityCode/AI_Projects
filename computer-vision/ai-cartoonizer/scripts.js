const upload = document.getElementById('upload');
const processBtn = document.getElementById('process');
const inputImg = document.getElementById('inputImg');
const canvas = document.getElementById('outputCanvas');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

let model;

upload.addEventListener('change', async () => {
  const file = upload.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  inputImg.src = url;
  inputImg.onload = () => {
    processBtn.disabled = false;
    canvas.width = inputImg.naturalWidth;
    canvas.height = inputImg.naturalHeight;
    status.innerText = 'Ready to cartoonize!';
  };
});

processBtn.addEventListener('click', async () => {
  if (!model) {
    status.innerText = 'Loading model...';
    model = await tf.loadGraphModel('./models/model.json');
    status.innerText = 'Model loaded.';
  }
  status.innerText = 'Cartoonizing... (this may take a few seconds)';
  const imgTensor = tf.browser.fromPixels(inputImg)
    .toFloat()
    .div(tf.scalar(127.5))
    .sub(tf.scalar(1))
    .expandDims();
  const output = await model.executeAsync(imgTensor);
  const processed = output.squeeze().mul(tf.scalar(0.5)).add(tf.scalar(0.5)).mul(tf.scalar(255)).clamp(0,255).toInt();
  await tf.browser.toPixels(processed, canvas);
  imgTensor.dispose(); output.dispose(); processed.dispose();
  status.innerText = 'Done!';
});
