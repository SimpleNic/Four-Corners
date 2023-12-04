const startBoard = Array(14).fill(4); // 14 pits, each with 4 stones
startBoard[6] = 0; // Player 1's store
startBoard[13] = 0; // Player 2's store

let currentPlayer = 1;

const boardElem = document.getElementById('board');
const resultElem = document.getElementById('result');
const turnElem = document.getElementById('turn');

startBoard.forEach((stones, index) => {
    const pitElem = document.createElement('div');
    pitElem.classList.add('pit');
    pitElem.textContent = stones;
    pitElem.addEventListener('click', () => move(index));
    boardElem.appendChild(pitElem);
});

function move(pitIndex) {
    if (pitIndex === 6 || pitIndex === 13) {
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

    if (
        (currentPlayer === 1 && currentIndex % 14 >= 1 && currentIndex % 14 <= 6 && startBoard[currentIndex % 14] === 1) ||
        (currentPlayer === 2 && currentIndex % 14 >= 8 && currentIndex % 14 <= 13 && startBoard[currentIndex % 14] === 1)
    ) {
        const opposingPit = 13 - currentIndex % 14;
        const stoneCollection = startBoard[currentIndex % 14] + startBoard[opposingPit];
        startBoard[currentIndex % 14] = 0;
        startBoard[opposingPit] = 0;
        startBoard[currentPlayer === 1 ? 6 : 13] += stoneCollection;
    }

    currentPlayer = 3 - currentPlayer;

    updateBoardDisplay();
    updateTurnIndicator();

    const player1Empty = startBoard.slice(0, 6).every(stones => stones === 0);
    const player2Empty = startBoard.slice(7, 13).every(stones => stones === 0);

    if (player1Empty || player2Empty) {
        endGame();
        return;
    }
}

function endGame() {
    const p1Stones = startBoard.slice(0, 6).reduce((sum, stones) => sum + stones, 0);
    const p2Stones = startBoard.slice(7, 13).reduce((sum, stones) => sum + stones, 0);

    if (p1Stones > p2Stones) {
        resultElem.textContent = "Player 1 wins!";
    } else if (p2Stones > p1Stones) {
        resultElem.textContent = "Player 2 wins!";
    } else {
        resultElem.textContent = "It's a tie!";
    }

    resultElem.style.color = "#ffffff";
}

function updateBoardDisplay() {
    const pitElem = document.querySelectorAll('.pit');
    pitElem.forEach((pit, index) => {
        pit.textContent = startBoard[index];
    });
}

function updateTurnIndicator() {
    turnElem.textContent = `Turn: Player ${currentPlayer}`;
}