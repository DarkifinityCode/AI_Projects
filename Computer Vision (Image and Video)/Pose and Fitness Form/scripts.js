let net;

async function setupCamera() {
    const video = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true
    });
    video.srcObject = stream;
    await new Promise(resolve => {
        video.onloadedmetadata = () => resolve(video);
    });
    return video;
}

async function loadModel() {
    net = await posenet.load();
    document.getElementById("status").innerText = "Model Loaded ✅";
}

function drawKeypoints(keypoints, ctx) {
    keypoints.forEach(point => {
        if (point.score > 0.5) {
            ctx.beginPath();
            ctx.arc(point.position.x, point.position.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = "red";
            ctx.fill();
        }
    });
}

function getAngle(a, b, c) {
    const AB = { x: b.x - a.x, y: b.y - a.y };
    const BC = { x: c.x - b.x, y: c.y - b.y };

    const dotProduct = AB.x * BC.x + AB.y * BC.y;
    const magAB = Math.sqrt(AB.x**2 + AB.y**2);
    const magBC = Math.sqrt(BC.x**2 + BC.y**2);

    const angle = Math.acos(dotProduct / (magAB * magBC));
    return angle * (180 / Math.PI);
}

function checkSquat(keypoints) {
    const leftHip = keypoints[11].position;
    const leftKnee = keypoints[13].position;
    const leftAnkle = keypoints[15].position;

    const kneeAngle = getAngle(leftHip, leftKnee, leftAnkle);

    if (kneeAngle < 100) {
        return "Good Squat ✅";
    }
    return "Bend Lower ⬇";
}

function checkPushup(keypoints) {
    const leftShoulder = keypoints[5].position;
    const leftElbow = keypoints[7].position;
    const leftWrist = keypoints[9].position;

    const elbowAngle = getAngle(leftShoulder, leftElbow, leftWrist);

    if (elbowAngle < 90) {
        return "Push-Up Down ✅";
    }
    return "Lower Your Body ⬇";
}

async function detectPose(video) {
    const pose = await net.estimateSinglePose(video, {
        flipHorizontal: false
    });

    const canvas = document.getElementById('output');
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    drawKeypoints(pose.keypoints, ctx);

    let feedbackText = "";

    if (pose.keypoints[13].score > 0.5 && pose.keypoints[15].score > 0.5) {
        feedbackText = checkSquat(pose.keypoints);
    } else if (pose.keypoints[7].score > 0.5 && pose.keypoints[9].score > 0.5) {
        feedbackText = checkPushup(pose.keypoints);
    } else {
        feedbackText = "Stand in Frame 📷";
    }

    document.getElementById("feedback").innerText = feedbackText;

    requestAnimationFrame(() => detectPose(video));
}

async function start() {
    const video = await setupCamera();
    video.play();
    await loadModel();
    detectPose(video);
}

start();
