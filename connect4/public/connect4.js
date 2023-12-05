const socket = io("localhost:3003", {
    withCredentials: true,
    extraHeaders: {
      "Access-Control-Allow-Origin":'*'
    }
  });
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

var playerRed = "R";
var playerBlack = "B";
var currPlayer = playerRed;

var gameOver = false;

var rows = 6;
var columns = 7;
var currColumns = []; 

var x;
var y;

var board = [[0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0]];

function setGame(board) 
{
    
    currColumns = [5, 5, 5, 5, 5, 5, 5];
    
    ctx.fillStyle = "rgb(252, 223, 3)";
    ctx.fillRect(0,0,630,540);

    for (let r = 0; r < rows; r++) 
    {
        for (let c = 0; c < columns; c++) 
        {
            if(board[r][c] == 1)
            {
                ctx.beginPath();
                ctx.arc((c*70)+45+c*20, (r*70)+45+r*20, 35, 0, 2 * Math.PI);
                ctx.fillStyle = "red";
                ctx.fill();
            }
            else if(board[r][c] == 2)
            {
                ctx.beginPath();
                ctx.arc((c*70)+45+c*20, (r*70)+45+r*20, 35, 0, 2 * Math.PI);
                ctx.fillStyle = "black";
                ctx.fill();
            }
            else
            {
                ctx.beginPath();
                ctx.arc((c*70)+45+c*20, (r*70)+45+r*20, 35, 0, 2 * Math.PI);
                ctx.fillStyle = "white";
                ctx.fill();
            }
            
        }
    }
}

function setPiece() 
{
    if (gameOver) 
    {
        return;
    }
    
    let c = Math.floor(x/90);
    let r = 5;

    if (c < 0) 
    { 
        return;
    }

    else if(c <= 6)
    {
        if (currPlayer == playerRed) 
        {
            r=5;
            while((board[r][c] == 1 || board[r][c] == 2) && r>=0)
            {
                r--;
            }
            ctx.beginPath();
            ctx.arc((c*70)+45+c*20, (r*70)+45+r*20, 35, 0, 2 * Math.PI);
            ctx.fillStyle = "red";
            ctx.fill();
    
            board[r][c] = 1;
            currPlayer = playerBlack;
    
        }
        else 
        {
            r=5;
            while((board[r][c] == 1 || board[r][c] == 2) && r>=0)
            {
                r--;
            }
            ctx.beginPath();
            ctx.arc((c*70)+45+c*20, (r*70)+45+r*20, 35, 0, 2 * Math.PI);
            ctx.fillStyle = "black";
            ctx.fill();
    
            board[r][c] = 2;
    
            currPlayer = playerRed;
        }
    
        r -= 1; 
        currColumns[c] = r; 
    
        checkWinner();
    }
    
    else
    {
        return
    }
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
    if (currPlayer =! playerRed) 
    {
        winner.innerText = "Red Wins";             
    } 
    else 
    {
        winner.innerText = "Black Wins";
    }
    socket.emit('winner', board);
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

function handleMouseDown(e)
{
    let aCurrPlayer = currPlayer;
    setPiece();
    if(nextTurn(aCurrPlayer))
    {
        socket.emit('next turn', board);
    }
}

function nextTurn(aCurrPlayer)
{
    let isNext = false;
    if(currPlayer != aCurrPlayer)
    {
        isNext = true;
    }
    return isNext;
}

function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect()
    x = event.clientX - rect.left
    y = event.clientY - rect.top
}
const connect4Canvas = document.querySelector('canvas')
canvas.addEventListener('mousedown', function(e) {
    getCursorPosition(canvas, e)
})

socket.on('onload board', server_board => {
    board = server_board.slice();
    setGame(board);
});

socket.on('winner reset', server_board =>
{
    board = server_board.slice();
    setGame(board);
    gameOver = true;
    setWinner();
    currPlayer = playerRed;
});

canvas.onmousedown = handleMouseDown;