document.getElementById("upload").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        let img = new Image();
        img.onload = function () {
            const canvas = document.getElementById("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            detectLicensePlate(canvas);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

async function detectLicensePlate(canvas) {
    await cv['onRuntimeInitialized'];

    let src = cv.imread(canvas);
    let gray = new cv.Mat();
    let blurred = new cv.Mat();
    let edged = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
    cv.Canny(blurred, edged, 100, 200);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(edged, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

    let plateRegion = null;
    for (let i = 0; i < contours.size(); i++) {
        let rect = cv.boundingRect(contours.get(i));
        let aspectRatio = rect.width / rect.height;
        if (aspectRatio > 2 && aspectRatio < 6 && rect.width > 60 && rect.height > 20) {
            plateRegion = rect;
            break;
        }
    }

    if (plateRegion) {
        let plateMat = src.roi(plateRegion);
        let plateCanvas = document.createElement("canvas");
        plateCanvas.width = plateMat.cols;
        plateCanvas.height = plateMat.rows;
        cv.imshow(plateCanvas, plateMat);

        readPlateText(plateCanvas);
        plateMat.delete();
    } else {
        document.getElementById("output").innerText = "No license plate detected.";
    }

    src.delete(); gray.delete(); blurred.delete(); edged.delete();
    contours.delete(); hierarchy.delete();
}

function readPlateText(plateCanvas) {
    Tesseract.recognize(
        plateCanvas,
        'eng',
        { logger: m => console.log(m) }
    ).then(({ data: { text } }) => {
        document.getElementById("output").innerText = "Detected Plate: " + text.trim();
    });
}
