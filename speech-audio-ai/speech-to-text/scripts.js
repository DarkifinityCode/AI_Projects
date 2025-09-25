const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const transcriptDiv = document.getElementById("transcript");
const statusDiv = document.getElementById("status");

let recognition;
let isRecognizing = false;

// Check if browser supports Web Speech API
if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    alert("Sorry, your browser doesn't support Speech Recognition.");
} else {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
        isRecognizing = true;
        statusDiv.innerText = "Listening...";
        startBtn.disabled = true;
        stopBtn.disabled = false;
    };

    recognition.onend = () => {
        isRecognizing = false;
        statusDiv.innerText = "Stopped listening.";
        startBtn.disabled = false;
        stopBtn.disabled = true;
    };

    recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        transcriptDiv.innerText = transcript.trim();
    };

    startBtn.addEventListener("click", () => recognition.start());
    stopBtn.addEventListener("click", () => recognition.stop());
}
