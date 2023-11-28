const socket = io();
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

var is_down = false;
var mouse_x = 0;
var mouse_y = 0;
var client_color;

// ghost = piece was there but is currently grabbed by mouse
const ghost_piece = {
    x: NaN,
    y: NaN,
    piece: "__",
};

const TILE_SIZE = 80;
const BOARD_SIZE = TILE_SIZE*8;
const BOARD_X = (canvas.width-BOARD_SIZE)/2;
const BOARD_Y = (canvas.height-BOARD_SIZE)/2;
const IMG_SIZE = 42;
const IMG_SCALE = TILE_SIZE*0.84;
const IMG_OFF_CENTER = (TILE_SIZE-IMG_SCALE)/2;

// promote();
// check();
// checkmate();

// "__" = no piece
// "BQ" = black queen
// "WP" = white pawn
const chess_board = []


function getOffsets(piece){
    let xOffset = 42;
    let yOffset = 0;
    if(piece[0] == "B"){
        yOffset = 43;
    }
    switch (piece[1]){
        case "P":
            xOffset = xOffset*5;
            break;
        case "N":
            xOffset = xOffset*4;
            break;
        case "B":
            xOffset = xOffset*3;
            break;
        case "R":
            xOffset = xOffset*2+1;
            break;
        case "Q":
            xOffset = xOffset*1;
            break; 
        case "K":
            xOffset = xOffset*0-1;
            break;
    }
    return [xOffset,yOffset];
}

// Note: canvas coords are verticaly flipped on a chess board
function draw(){
    //Draw chess board
    for(let i=0; i<8; i++){
        for(let j=0; j<8; j++){
            if((i+j)%2 == 0) ctx.fillStyle = "#d1d0cb";
            else ctx.fillStyle = "#1c8a2a";
            ctx.fillRect(j*TILE_SIZE+BOARD_X,i*TILE_SIZE+BOARD_Y,TILE_SIZE,TILE_SIZE);
        }
    }

    //Draw static chess pieces
    if(chess_board.length == 0) return;
    for(let i=0; i<8; i++){
        for(let j=0; j<8; j++){
            let piece = chess_board[i][j];
            if(piece == "__") continue;
            let offsets = getOffsets(piece);
            ctx.drawImage(document.getElementById("pieces"), 
                offsets[0], offsets[1], 
                IMG_SIZE, IMG_SIZE, 
                j*TILE_SIZE+IMG_OFF_CENTER+BOARD_X, i*TILE_SIZE+IMG_OFF_CENTER+BOARD_Y, 
                IMG_SCALE, IMG_SCALE);
        }
    }
    
    // Draw grabbed piece
    if(ghost_piece.piece == "__") return;
    let offsets = getOffsets(ghost_piece.piece);
    ctx.drawImage(document.getElementById("pieces"), 
        offsets[0], offsets[1], 
        IMG_SIZE, IMG_SIZE, 
        mouse_x-IMG_SCALE/2, mouse_y-IMG_SCALE/2, 
        IMG_SCALE, IMG_SCALE);
}

// Note: canvas coords are verticaly flipped on a chess board 
function handleMouseDown(e){
    is_down = true;
    mouse_x = e.offsetX;
    mouse_y = e.offsetY;

    let x = Math.floor((mouse_x-BOARD_X)/TILE_SIZE);
    let y = Math.floor((mouse_y-BOARD_Y)/TILE_SIZE);
    if(x < 0 || x > 7 || y < 0 || y > 7) return;
    let piece = chess_board[y][x];
    if(piece == "__" || piece[0] != client_color) return;
    ghost_piece.x = x;
    ghost_piece.y = y;
    ghost_piece.piece = piece;
    chess_board[y][x] = "__";
}

function handleMouseUp(e){
    is_down = false;
    if(ghost_piece.piece == "__") return;
    let x = Math.floor((mouse_x-BOARD_X)/TILE_SIZE);
    let y = Math.floor((mouse_y-BOARD_Y)/TILE_SIZE);
    if(ghost_piece.x != x || ghost_piece.y != y) socket.emit("game update", ghost_piece, x, y)
    else chess_board[ghost_piece.y][ghost_piece.x] = ghost_piece.piece;
    ghost_piece.x = NaN;
    ghost_piece.y = NaN;
    ghost_piece.piece = "__";
}

function handleMouseLeave(e){
    if(!is_down || ghost_piece.piece == "__") return;
    chess_board[ghost_piece.y][ghost_piece.x] = ghost_piece.piece;
    ghost_piece.x = NaN;
    ghost_piece.y = NaN;
    ghost_piece.piece = "__";
}

function handleMouseMove(e){
    if(!is_down) return;
    mouse_x = e.offsetX;
    mouse_y = e.offsetY;
}

function loop(){
    draw();
    requestAnimationFrame(loop);
}
loop();

// update chess board
socket.on("game update", (chess_board_rec) => {
    chess_board.length = 0;
    for(let i=0; i<8; i++){
        chess_board.push(chess_board_rec[i]);
    }
    if(client_color == "B"){
        chess_board.reverse();
        for(let i=0; i<8; i++){
            chess_board[i].reverse();
        }
    }
});

// assign the side client plays as
socket.on("assign color", (assigned_color) => {
    client_color = assigned_color;
    console.log(assigned_color)
})

canvas.onmousedown = handleMouseDown;
canvas.onmouseup = handleMouseUp;
canvas.onmouseleave = handleMouseLeave;
canvas.onmousemove = handleMouseMove;