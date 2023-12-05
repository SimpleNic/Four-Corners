let startBoard = Array(14).fill(4);
startBoard[6] = 0;
startBoard[13] = 0;
let currentPlayer = 1;
let localPlayerTurn = 1; 
let gameOver = false; 

const params = new URLSearchParams(window.location.search);
username = params.get("user");
lobby_id = params.get("lobby");
game_id = params.get("game");

const boardElem = document.getElementById("board");
const resultElem = document.getElementById("result");
const turnElem = document.getElementById("turn");


function createPit(index) {
    const pitElem = document.createElement("div");
    pitElem.classList.add("pit");
    pitElem.textContent = startBoard[index];
    pitElem.addEventListener("click", () => move(index));
    return pitElem;
}


startBoard.forEach((stones, index) => {
    boardElem.appendChild(createPit(index));
});


function boardUpdate() {
    const pitElem = document.querySelectorAll(".pit");
    pitElem.forEach((pit, index) => {
        pit.textContent = startBoard[index];
    });
}


function turnUpdate() {
    turnElem.textContent = `Turn: Player ${currentPlayer}`;
}


function move(pitIndex) {
    if (gameOver || pitIndex === 6 || pitIndex === 13 || currentPlayer !== localPlayerTurn) {
        return;
    }

    let stonesMove = startBoard[pitIndex];
    if (stonesMove === 0) {
        return;
    }

    startBoard[pitIndex] = 0;

    let currentIndex = pitIndex + 1;
    while (stonesMove > 0) {
        if (!((currentPlayer === 1 && currentIndex === 13) || (currentPlayer === 2 && currentIndex === 6))) {
            startBoard[currentIndex % 14]++;
            stonesMove--;
        }
        currentIndex++;
    }

    if ((currentPlayer === 1 && currentIndex % 14 >= 1 && currentIndex % 14 <= 6 && startBoard[currentIndex % 14] === 1) ||
        (currentPlayer === 2 && currentIndex % 14 >= 8 && currentIndex % 14 <= 13 && startBoard[currentIndex % 14] === 1)) {
            const opposingPit = 13 - currentIndex % 14;
            const stoneCollection = startBoard[currentIndex % 14] + startBoard[opposingPit];
            startBoard[currentIndex % 14] = 0;
            startBoard[opposingPit] = 0;
            startBoard[currentPlayer === 1 ? 6 : 13] += stoneCollection;
    }

    isGameOver();

    if (!gameOver) {
        currentPlayer = 3 - currentPlayer;
        localPlayerTurn = currentPlayer; 
        turnUpdate();
    }

    boardUpdate();

    socket.emit('move', { pitIndex, startBoard, currentPlayer });
}


function isGameOver() {
    const player1Empty = startBoard.slice(0, 6).every(stones => stones === 0);
    const player2Empty = startBoard.slice(7, 13).every(stones => stones === 0);

    if (player1Empty || player2Empty) {
        endGame();
    }
}


function endGame() {
    gameOver = true;
    const p1Stones = startBoard.slice(0, 6).reduce((sum, stones) => sum + stones, 0);
    const p2Stones = startBoard.slice(7, 13).reduce((sum, stones) => sum + stones, 0);

    if (p1Stones > p2Stones) {
        resultElem.textContent = "Congratulations Player 1, you win!";
    } else if (p2Stones > p1Stones) {
        resultElem.textContent = "Congratulations Player 2, you win!";
    } else {
        resultElem.textContent = "Everyone Wins!";
    }
    resultElem.style.color = "#ffffff";
}

socket.on('start', ({ startBoard: initialBoard, currentPlayer: initialPlayer }) => {
    startBoard = initialBoard;
    currentPlayer = initialPlayer;
    localPlayerTurn = currentPlayer;

    boardUpdate();
    turnUpdate();
});


socket.on('updation', ({ startBoard: updatedBoard, currentPlayer: updatedPlayer }) => {
    startBoard = updatedBoard;
    currentPlayer = updatedPlayer;
    localPlayerTurn = currentPlayer;
    boardUpdate();
    turnUpdate();
});


socket.on('gameOver', (message) => {
    endGame();
});
