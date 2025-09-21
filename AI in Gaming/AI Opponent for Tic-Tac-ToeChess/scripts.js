const boardElement = document.getElementById("board");
const resetBtn = document.getElementById("resetBtn");
const statusText = document.getElementById("status");

let board = Array(9).fill(null);
let gameOver = false;

// Initialize Board
function createBoard() {
  boardElement.innerHTML = "";
  board.forEach((val, idx) => {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    if (val) {
      cell.textContent = val;
      cell.classList.add("taken");
    }
    cell.addEventListener("click", () => playerMove(idx));
    boardElement.appendChild(cell);
  });
}

// Player Move
function playerMove(index) {
  if (board[index] || gameOver) return;
  board[index] = "X";
  createBoard();
  if (checkWinner(board, "X")) {
    statusText.textContent = "You Win! 🎉";
    gameOver = true;
    return;
  }
  if (board.every(cell => cell)) {
    statusText.textContent = "Draw!";
    return;
  }
  setTimeout(aiMove, 300); // AI makes move
}

// AI Move using Minimax
function aiMove() {
  const best = minimax(board, "O");
  board[best.index] = "O";
  createBoard();
  if (checkWinner(board, "O")) {
    statusText.textContent = "AI Wins! 🤖";
    gameOver = true;
    return;
  }
  if (board.every(cell => cell)) {
    statusText.textContent = "Draw!";
  }
}

// Minimax Algorithm
function minimax(newBoard, player) {
  const availSpots = newBoard.map((v, i) => (v ? null : i)).filter(v => v !== null);

  if (checkWinner(newBoard, "X")) return { score: -10 };
  if (checkWinner(newBoard, "O")) return { score: 10 };
  if (availSpots.length === 0) return { score: 0 };

  const moves = [];

  for (let i = 0; i < availSpots.length; i++) {
    const move = {};
    move.index = availSpots[i];
    newBoard[availSpots[i]] = player;

    if (player === "O") {
      const result = minimax(newBoard, "X");
      move.score = result.score;
    } else {
      const result = minimax(newBoard, "O");
      move.score = result.score;
    }

    newBoard[availSpots[i]] = null;
    moves.push(move);
  }

  let bestMove;
  if (player === "O") {
    let bestScore = -Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score > bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score < bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  }

  return moves[bestMove];
}

// Check Winner
function checkWinner(b, player) {
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]          // diagonals
  ];
  return winPatterns.some(pattern => pattern.every(i => b[i] === player));
}

// Reset Game
resetBtn.addEventListener("click", () => {
  board = Array(9).fill(null);
  gameOver = false;
  statusText.textContent = "";
  createBoard();
});

createBoard();
