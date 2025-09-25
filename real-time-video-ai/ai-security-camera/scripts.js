const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('status');

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  return new Promise(resolve => {
    video.onloadedmetadata = () => resolve(video);
  });
}

async function main() {
  await setupCamera();
  video.play();

  const model = await cocoSsd.load();
  statusText.innerText = "✅ Model Loaded — Monitoring for People";

  detectFrame(video, model);
}

function detectFrame(video, model) {
  model.detect(video).then(predictions => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    let personDetected = false;

    predictions.forEach(pred => {
      if (pred.class === "person" && pred.score > 0.5) {
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 3;
        ctx.strokeRect(pred.bbox[0], pred.bbox[1], pred.bbox[2], pred.bbox[3]);
        ctx.fillStyle = "red";
        ctx.font = "16px Arial";
        ctx.fillText("Person", pred.bbox[0], pred.bbox[1] > 10 ? pred.bbox[1] - 5 : 10);
        personDetected = true;
      }
    });

    if (personDetected) {
      statusText.innerText = "🚨 ALERT: Person Detected!";
      statusText.style.color = "red";
    } else {
      statusText.innerText = "No person detected.";
      statusText.style.color = "#eee";
    }

    requestAnimationFrame(() => detectFrame(video, model));
  });
}

main();
