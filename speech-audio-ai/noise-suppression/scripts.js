const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const outputAudio = document.getElementById('outputAudio');

let model = null;
let audioCtx = null;
let sourceNode = null;
let processorNode = null;
let stream = null;

// Load pretrained noise suppression model
async function loadModel(){
  model = await tf.loadLayersModel('model.json'); // your denoising model
  console.log('Noise suppression model loaded!');
}
loadModel();

startBtn.addEventListener('click', async () => {
  if(!model) return alert('Model not loaded yet');

  statusEl.innerText = 'Status: Listening...';
  startBtn.disabled = true;
  stopBtn.disabled = false;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  stream = await navigator.mediaDevices.getUserMedia({ audio:true });
  sourceNode = audioCtx.createMediaStreamSource(stream);

  processorNode = audioCtx.createScriptProcessor(2048,1,1);
  processorNode.onaudioprocess = (e)=>{
    const inputData = e.inputBuffer.getChannelData(0);
    const tensorInput = tf.tensor(inputData).reshape([1, inputData.length,1]);
    const outputTensor = model.predict(tensorInput);
    const outputData = outputTensor.dataSync();

    const outputBuffer = e.outputBuffer.getChannelData(0);
    for(let i=0; i<outputBuffer.length; i++){
      outputBuffer[i] = outputData[i] || 0;
    }
  };

  sourceNode.connect(processorNode);
  processorNode.connect(audioCtx.destination);
});

stopBtn.addEventListener('click', () => {
  processorNode.disconnect();
  sourceNode.disconnect();
  stream.getTracks().forEach(track => track.stop());
  audioCtx.close();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  statusEl.innerText = 'Status: Idle';
});
