const sendBtn = document.getElementById('sendBtn');
const userInput = document.getElementById('userInput');
const chatBox = document.getElementById('chatBox');

let knowledgeBase = [];

// Load knowledge base from public folder
async function loadKnowledge() {
    try {
        const response = await fetch('public/prompts.json');
        knowledgeBase = await response.json();
    } catch (error) {
        console.error('Failed to load knowledge base:', error);
    }
}
loadKnowledge();

// Find the best answer by simple string matching
function findBestAnswer(question) {
    question = question.toLowerCase().trim();
    let bestMatch = null;
    for (const item of knowledgeBase) {
        if (item.question.toLowerCase() === question) {
            bestMatch = item.answer;
            break;
        }
    }
    return bestMatch || "Sorry, I don't know the answer.";
}

// Append message to chat box
function appendMessage(text, className) {
    const msgDiv = document.createElement('div');
    msgDiv.className = className;
    msgDiv.innerText = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Send message
function sendMessage() {
    const userText = userInput.value.trim();
    if (!userText) return;
    appendMessage(userText, 'user-msg');
    userInput.value = '';

    const botReply = findBestAnswer(userText);
    appendMessage(botReply, 'bot-msg');
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});