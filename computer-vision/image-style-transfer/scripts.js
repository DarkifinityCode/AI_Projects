let model;
const contentImage = document.getElementById("contentImage");
const styleImage = document.getElementById("styleImage");
const contentUpload = document.getElementById("contentImageUpload");
const styleUpload = document.getElementById("styleImageUpload");
const transferBtn = document.getElementById("transferBtn");
const resultCanvas = document.getElementById("resultCanvas");
const ctx = resultCanvas.getContext("2d");

// Load pre-trained style transfer model
async function loadModel() {
    model = await tf.loadGraphModel('https://storage.googleapis.com/tfjs-models/savedmodel/style_transfer/mobilenet_v2/model.json');
    console.log("Model loaded!");
}

// Preview uploaded images
function loadImage(event, imgElement) {
    const reader = new FileReader();
    reader.onload = e => imgElement.src = e.target.result;
    reader.readAsDataURL(event.target.files[0]);
}

contentUpload.addEventListener("change", e => loadImage(e, contentImage));
styleUpload.addEventListener("change", e => loadImage(e, styleImage));

// Apply style transfer
transferBtn.addEventListener("click", async () => {
    if (!contentImage.src || !styleImage.src) {
        alert("Please upload both content and style images!");
        return;
    }

    transferBtn.innerText = "Processing...";
    transferBtn.disabled = true;

    const styleNet = await tf.loadGraphModel('https://tfhub.dev/google/tfjs-model/magenta/arbitrary-image-stylization-v1-256/2', {fromTFHub: true});
    const contentTensor = tf.browser.fromPixels(contentImage).toFloat().div(tf.scalar(255)).expandDims();
    const styleTensor = tf.browser.fromPixels(styleImage).toFloat().div(tf.scalar(255)).expandDims();

    const stylized = await styleNet.executeAsync({ 
        'placeholder': contentTensor, 
        'placeholder_1': styleTensor 
    });

    await tf.browser.toPixels(stylized[0], resultCanvas);

    transferBtn.innerText = "Apply Style";
    transferBtn.disabled = false;
});

loadModel();
