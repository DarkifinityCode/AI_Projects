const upload = document.getElementById('upload');
const enhanceBtn = document.getElementById('enhance');
const inputImg = document.getElementById('inputImg');
const canvas = document.getElementById('outputCanvas');
const status = document.getElementById('status');

let upscaler;

upload.addEventListener('change', () => {
  const file = upload.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  inputImg.src = url;
  inputImg.onload = () => {
    canvas.width = inputImg.naturalWidth;
    canvas.height = inputImg.naturalHeight;
    enhanceBtn.disabled = false;
    status.innerText = 'Ready to enhance!';
  };
});

enhanceBtn.addEventListener('click', async () => {
  enhanceBtn.disabled = true;
  status.innerText = 'Enhancing...';
  if (!upscaler) {
    upscaler = new upscaler.Upscaler({
      model: 'manga', // or '4x', 'original' based on Upscaler options
      scale: 2 // 2x or 4x
    });
    await upscaler.init();
  }

  const output = await upscaler.upscale(inputImg);
  const ctx = canvas.getContext('2d');
  canvas.width = output.width;
  canvas.height = output.height;
  ctx.drawImage(output, 0, 0);
  status.innerText = 'Enhancement complete!';
});
