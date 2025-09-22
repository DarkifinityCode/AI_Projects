const SIZE = 256, sampleNum = 7;
let inputCanvas, outputContainer, statusMsg, transferBtn, sampleIndex = 0, modelReady = false, isTransfering = false;
const inputImgs = [], outputImgs = [];

const edges2pikachu = pix2pix('./models/colorize_AtoB.pict', modelLoaded);

function transfer() {
  isTransfering = true;
  // Update status message
//  statusMsg.innerHTML= 'Applying Style Transfer...!';
  // Select canvas DOM element
  let canvasElement = document.getElementById('input_image');
  console.log("")
  edges2pikachu.transfer(canvasElement, result => {
    document.getElementById("output_image").src=result.src;
//    statusMsg.innerHTML= 'Done!';
    isTransfering = false;
  });
}

// A function to be called when the models have loaded
function modelLoaded() {
  console.log("completed!");
//  if (!statusMsg) statusMsg = document.getElementById('status');
//  statusMsg.innerHTML= 'Model Loaded!';
  modelReady = true;
  document.getElementById('convertBtn').style.visibility="";
}

// Clear the canvas
function clearCanvas() {
  document.getElementById("input_image").src="./images/input_init.jpg";
  document.getElementById("output_image").src="./images/output_init.jpg"
}

window.addEventListener('load', function() {
  document.querySelector('input[type="file"]').addEventListener('change', function() {
      if (this.files && this.files[0]) {
          var img = document.querySelector('img');
          img.onload = () => {
              URL.revokeObjectURL(img.src);  // no longer needed, free memory
          }
          img.src = URL.createObjectURL(this.files[0]); // set src to blob url
      }
  });
});
