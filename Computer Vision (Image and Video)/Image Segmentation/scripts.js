let net;

async function loadModel() {
    document.getElementById('status').innerText = "Loading model...";
    net = await bodyPix.load();
    document.getElementById('status').innerText = "Model loaded! Upload an image.";
}

document.getElementById('imageUpload').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
        const canvas = document.getElementById('outputCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;

        document.getElementById('status').innerText = "Processing image...";
        const segmentation = await net.segmentPersonParts(img);

        const coloredPartImage = bodyPix.toColoredPartMask(segmentation);
        bodyPix.drawMask(
            canvas, img, coloredPartImage, 0.7, 0, false
        );
        document.getElementById('status').innerText = "Segmentation complete!";
    };
});

loadModel();
