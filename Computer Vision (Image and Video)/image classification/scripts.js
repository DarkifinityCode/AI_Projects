let model;

// Load the MobileNet model
async function loadModel() {
    document.getElementById("results").innerHTML = "<p>Loading AI model...</p>";
    model = await mobilenet.load();
    document.getElementById("results").innerHTML = "<p>Model loaded. Ready to classify!</p>";
}

loadModel();

// Preview uploaded image
document.getElementById("imageUpload").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.getElementById("preview");
        img.src = e.target.result;
        img.style.display = "block";
    };
    reader.readAsDataURL(file);
});

// Classify image
document.getElementById("classifyBtn").addEventListener("click", async function() {
    const imgElement = document.getElementById("preview");
    if (!imgElement.src) {
        alert("Please upload an image first.");
        return;
    }

    const predictions = await model.classify(imgElement);

    const resultsList = document.getElementById("predictionsList");
    resultsList.innerHTML = "";
    predictions.forEach(pred => {
        const li = document.createElement("li");
        li.textContent = `${pred.className} - ${(pred.probability * 100).toFixed(2)}%`;
        resultsList.appendChild(li);
    });
});
