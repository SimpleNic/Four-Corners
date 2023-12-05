const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');


const app = express();
const server = http.createServer(app);
const io = socketIO(server);


const PORT = process.env.PORT || 3000;


app.use(express.static(path.join(__dirname, 'public')));


let startBoard = Array(14).fill(4);
startBoard[6] = 0;
startBoard[13] = 0;
let currentPlayer = 1;


io.on('connection', (socket) => {
    console.log('user connected');

    socket.emit('start', { startBoard, currentPlayer });

    socket.on('move', ({ pitIndex, startBoard, currentPlayer }) => {

        console.log('The move has been receieved from ${username} in lobby ${lobby_id} for the game ${game_id} ');

        io.emit('updation', { startBoard, currentPlayer });

        isGameOver();
    });

    socket.on('gameOver', () => {
        endGame();
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        isGameOver();
    });
});

function isGameOver() {
    const player1Empty = startBoard.slice(0, 6).every(stones => stones === 0);
    const player2Empty = startBoard.slice(7, 13).every(stones => stones === 0);

    if (player1Empty || player2Empty) {
        endGame();
    }
}


function endGame() {
    const p1Stones = startBoard.slice(0, 6).reduce((sum, stones) => sum + stones, 0);
    const p2Stones = startBoard.slice(7, 13).reduce((sum, stones) => sum + stones, 0);

    if (p1Stones > p2Stones) {
        io.emit('gameOver', "Player 1 wins!");
    } else if (p2Stones > p1Stones) {
        io.emit('gameOver', "Player 2 wins!");
    } else {
        io.emit('gameOver', "It's a tie!");
    }
}


server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
