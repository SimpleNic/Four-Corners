import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const __publicPath = join(__dirname, "public");
app.use(express.static(__publicPath));

var playerRed = "R";
var playerBlack = "B";
var currPlayer = playerRed;

var gameOver = false;
var board;

var rows = 6;
var columns = 7;
var currColumns = []; 

io.on('connection', function(socket) {
    setGame();
});

function setGame() 
{
    board = [];
    currColumns = [5, 5, 5, 5, 5, 5, 5];

    for (let r = 0; r < rows; r++) 
    {
        let row = [];
        for (let c = 0; c < columns; c++) 
        {
            row.push(' ');
            let tile = document.createElement("div");
            tile.id = r.toString() + "-" + c.toString();
            tile.classList.add("tile");
            tile.addEventListener("click", setPiece);
            document.getElementById("board").append(tile);
        }
        board.push(row);
    }
}

function setPiece() 
{
    if (gameOver) 
    {
        return;
    }

    let coords = this.id.split("-");
    let r = parseInt(coords[0]);
    let c = parseInt(coords[1]);

    r = currColumns[c]; 

    if (r < 0) 
    { 
        return;
    }

    board[r][c] = currPlayer; 
    let tile = document.getElementById(r.toString() + "-" + c.toString());
    if (currPlayer == playerRed) 
    {
        tile.classList.add("red-piece");
        currPlayer = playerBlack;
    }
    else 
    {
        tile.classList.add("black-piece");
        currPlayer = playerRed;
    }

    r -= 1; 
    currColumns[c] = r; 

    checkWinner();
}

function checkWinner() 
{
     // check for horizontal victory
     for (let r = 0; r < rows; r++) 
     {
         for (let c = 0; c < columns-3; c++)
         {
            if (board[r][c] != ' ') 
            {
                if (board[r][c] == board[r][c+1] 
                    && board[r][c+1] == board[r][c+2] 
                    && board[r][c+2] == board[r][c+3]) 
                {
                    setWinner(r, c);
                    return;
                }
            }
         }
    }

    // check for vertical victory
    for (let c = 0; c < columns; c++) 
    {
        for (let r = 0; r < rows-3; r++) 
        {
            if (board[r][c] != ' ') 
            {
                if (board[r][c] == board[r+1][c] 
                    && board[r+1][c] == board[r+2][c] 
                    && board[r+2][c] == board[r+3][c]) 
                {
                    setWinner(r, c);
                    return;
                }
            }
        }
    }

    // check for anti diagonal victory
    for (let r = 0; r < rows-3; r++) 
    {
        for (let c = 0; c < columns - 3; c++) 
        {
            if (board[r][c] != ' ') 
            {
                if (board[r][c] == board[r+1][c+1] 
                    && board[r+1][c+1] == board[r+2][c+2] 
                    && board[r+2][c+2] == board[r+3][c+3])
                {
                    setWinner(r, c);
                    return;
                }
            }
        }
    }

    // check for diagonal victory
    for (let r = 3; r < rows; r++) 
    {
        for (let c = 0; c < columns-3; c++) 
        {
            if (board[r][c] != ' ') 
            {
                if (board[r][c] == board[r-1][c+1] 
                    && board[r-1][c+1] == board[r-2][c+2] 
                    && board[r-2][c+2] == board[r-3][c+3]) 
                {
                    setWinner(r, c);
                    return;
                }
            }
        }
    }
}

function setWinner(r, c) 
{
    let winner = document.getElementById("winner");
    if (board[r][c] == playerRed) 
    {
        winner.innerText = "Red Wins";             
    } 
    else 
    {
        winner.innerText = "Black Wins";
    }
    gameOver = true;
}

function setColor(c)
{
    let color = document.getElementById("color");
    if(assigned_color == 'R')
    {
        color.innerText = "You are Red";
    }
    else
    {
        color.innerText = "You are Black";
    }
}

io.sockets.on("assign color", (assigned_color) => {
    client_color = assigned_color;
})

server.listen(3000, () => {
    console.log("server running at http://localhost:3000");
  });