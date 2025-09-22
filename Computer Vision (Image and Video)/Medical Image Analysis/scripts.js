let model;

async function loadModel() {
    document.getElementById("result").innerText = "Loading model...";
    model = await tf.loadLayersModel("model/model.json");
    document.getElementById("result").innerText = "Model loaded. Ready!";
}

loadModel();

document.getElementById("fileInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById("preview").src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById("analyzeBtn").addEventListener("click", async () => {
    if (!model) {
        alert("Model not loaded yet!");
        return;
    }

    const img = document.getElementById("preview");
    if (!img.src) {
        alert("Please upload an image first!");
        return;
    }

    const tensor = tf.browser.fromPixels(img)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .div(tf.scalar(255.0))
        .expandDims();

    const prediction = model.predict(tensor);
    const data = await prediction.data();

    const confidence = data[0] > 0.5 ? data[0] * 100 : (1 - data[0]) * 100;
    const label = data[0] > 0.5 ? "Pneumonia Detected" : "Normal";

    document.getElementById("result").innerText = `${label} (${confidence.toFixed(2)}% confidence)`;
});
