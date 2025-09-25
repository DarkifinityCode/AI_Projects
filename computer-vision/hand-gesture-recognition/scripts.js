const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output');
const canvasCtx = canvasElement.getContext('2d');
const gestureElement = document.getElementById('gesture');

// Gesture classification helper
function classifyGesture(landmarks) {
    if (!landmarks) return "Detecting...";

    // Example: Rock-Paper-Scissors basic detection
    const yPositions = landmarks.map(l => l.y);
    const fingersExtended = yPositions.filter(y => y < landmarks[0].y).length;

    if (fingersExtended === 0) return "Rock ✊";
    if (fingersExtended === 5) return "Paper ✋";
    if (fingersExtended === 2) return "Scissors ✌️";
    return "Unknown 🤔";
}

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 4});
            drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});

            const gesture = classifyGesture(landmarks);
            gestureElement.textContent = `Gesture: ${gesture}`;
        }
    }
    canvasCtx.restore();
}

const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});
hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 640,
    height: 480
});
camera.start();
