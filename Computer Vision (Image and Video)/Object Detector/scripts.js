let model;
const imageUpload = document.getElementById("imageUpload");
const webcam = document.getElementById("webcam");
const uploadedImage = document.getElementById("uploadedImage");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const statusDiv = document.getElementById("status");

const startWebcamBtn = document.getElementById("startWebcam");
const stopWebcamBtn = document.getElementById("stopWebcam");

let webcamStream = null;

// Load the model
async function loadModel() {
    statusDiv.innerText = "Loading model...";
    model = await cocoSsd.load();
    statusDiv.innerText = "Model loaded! Ready to detect.";
}
loadModel();

// Handle image upload
imageUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        uploadedImage.src = event.target.result;
        uploadedImage.onload = () => {
            stopWebcam();
            runDetection(uploadedImage);
        };
    };
    reader.readAsDataURL(file);
});

// Start webcam
startWebcamBtn.addEventListener("click", async () => {
    stopWebcam();
    webcam.style.display = "block";
    uploadedImage.style.display = "none";
    canvas.style.display = "block";

    try {
        webcamStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        webcam.srcObject = webcamStream;
        webcam.onloadedmetadata = () => {
            webcam.play();
            detectWebcam();
        };
        startWebcamBtn.disabled = true;
        stopWebcamBtn.disabled = false;
    } catch (err) {
        alert("Error accessing webcam: " + err.message);
    }
});

// Stop webcam
stopWebcamBtn.addEventListener("click", () => {
    stopWebcam();
});

function stopWebcam() {
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
    }
    webcam.style.display = "none";
    startWebcamBtn.disabled = false;
    stopWebcamBtn.disabled = true;
}

// Run detection
async function runDetection(source) {
    if (!model) {
        statusDiv.innerText = "Model not loaded yet.";
        return;
    }

    resizeCanvas(source);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

    const predictions = await model.detect(source);
    drawPredictions(predictions);
}

// Webcam detection loop
async function detectWebcam() {
    if (!webcamStream) return;

    resizeCanvas(webcam);
    ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);

    const predictions = await model.detect(webcam);
    drawPredictions(predictions);

    requestAnimationFrame(detectWebcam);
}

// Draw bounding boxes
function drawPredictions(predictions) {
    predictions.forEach(prediction => {
        const [x, y, width, height] = prediction.bbox;
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = "#00FF00";
        ctx.font = "16px Arial";
        ctx.fillText(
            `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
            x,
            y > 20 ? y - 5 : y + 15
        );
    });
}

// Auto-resize canvas to match image/video
function resizeCanvas(source) {
    canvas.width = source.width || source.videoWidth;
    canvas.height = source.height || source.videoHeight;
}
