const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const extractBtn = document.getElementById('extractBtn');
const result = document.getElementById('result');
const loading = document.getElementById('loading');
let selectedFile = null;

// Preview image on file selection
fileInput.addEventListener('change', (e) => {
    selectedFile = e.target.files[0];
    if (selectedFile) {
        const reader = new FileReader();
        reader.onload = (event) => {
            preview.src = event.target.result;
            preview.style.display = "block";
        };
        reader.readAsDataURL(selectedFile);
    }
});

// OCR Extraction
extractBtn.addEventListener('click', () => {
    if (!selectedFile) {
        alert("Please upload an image first.");
        return;
    }

    loading.style.display = "block";
    result.textContent = "";

    Tesseract.recognize(
        preview.src,
        'eng', // Language: English
        {
            logger: info => console.log(info) // Progress logs
        }
    ).then(({ data: { text } }) => {
        loading.style.display = "none";
        result.textContent = text.trim();
    }).catch(err => {
        loading.style.display = "none";
        alert("Error reading text: " + err);
    });
});
