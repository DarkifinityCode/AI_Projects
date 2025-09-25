let net;

async function setupCamera() {
    const video = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true
    });
    video.srcObject = stream;
    await new Promise(resolve => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
    return video;
}

async function loadModel() {
    net = await bodyPix.load();
    console.log("BodyPix model loaded");
}

async function start() {
    const video = await setupCamera();
    video.play();
    await loadModel();

    const canvas = document.getElementById('output');
    const ctx = canvas.getContext('2d');

    async function removeBackground() {
        const segmentation = await net.segmentPerson(video);

        const maskBackground = true;
        const backgroundColor = { r: 0, g: 0, b: 0, a: 0 }; // Transparent background
        const personColor = { r: 255, g: 255, b: 255, a: 255 };

        const coloredPartImage = bodyPix.toMask(
            segmentation,
            personColor,
            backgroundColor
        );

        ctx.putImageData(coloredPartImage, 0, 0);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        requestAnimationFrame(removeBackground);
    }

    removeBackground();
}

start();
