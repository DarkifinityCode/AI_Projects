const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");
const ctx = overlay.getContext("2d");

async function loadModels() {
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    await faceapi.nets.faceExpressionNet.loadFromUri("/models");
    console.log("Models loaded!");
}

async function startVideo() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
}

video.addEventListener("play", () => {
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();

        ctx.clearRect(0, 0, overlay.width, overlay.height);

        detections.forEach(detection => {
            const { x, y, width, height } = detection.detection.box;
            ctx.strokeStyle = "#00ff00";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

            const emotions = detection.expressions;
            const topEmotion = Object.keys(emotions).reduce((a, b) => emotions[a] > emotions[b] ? a : b);

            ctx.fillStyle = "yellow";
            ctx.font = "16px Arial";
            ctx.fillText(topEmotion, x, y - 10);
        });
    }, 200);
});

startBtn.addEventListener("click", async () => {
    await loadModels();
    await startVideo();
    startBtn.style.display = "none";
});
