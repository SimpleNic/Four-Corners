const socket = io();
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

var is_down = false;
var mouse_x = 0;
var mouse_y = 0;
var client_color;
var pawn_promoted = false;
var checkmated = "_";

// ghost = piece was there but is currently grabbed by mouse
const ghost_piece = {
    x: NaN,
    y: NaN,
    piece: "__",
};

const promote_piece = {
    x: NaN,
    y: NaN,
    piece: "__",
}

const TILE_SIZE = 80;
const BOARD_SIZE = TILE_SIZE*8;
const BOARD_X = (canvas.width-BOARD_SIZE)/2;
const BOARD_Y = (canvas.height-BOARD_SIZE)/2;

const IMG_SIZE = 42;
const IMG_SCALE = TILE_SIZE*0.84;
const IMG_OFF_CENTER = (TILE_SIZE-IMG_SCALE)/2;

const P_TILE_SIZE = TILE_SIZE*1.25;
const P_BOARD_X = 2.75*TILE_SIZE+BOARD_X;
const P_BOARD_Y = 2.75*TILE_SIZE+BOARD_Y;
const P_OFF_CENTER = IMG_OFF_CENTER*2.5;

// "__" = no piece
// "BQ" = black queen
// "WP" = white pawn
const chess_board = [];



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
            ctx.beginPath();
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
    if(ghost_piece.piece != "__"){
        let offsets = getOffsets(ghost_piece.piece);
        ctx.drawImage(document.getElementById("pieces"), 
            offsets[0], offsets[1], 
            IMG_SIZE, IMG_SIZE, 
            mouse_x-IMG_SCALE/2, mouse_y-IMG_SCALE/2, 
            IMG_SCALE, IMG_SCALE);
    }

    // Draw pawn promotion
    if(pawn_promoted){
        let knight_offsets = getOffsets(client_color+"N");
        let bishop_offsets = getOffsets(client_color+"B");
        let rook_offsets = getOffsets(client_color+"R");
        let queen_offsets = getOffsets(client_color+"Q");
        let arr_offsets = [rook_offsets, knight_offsets, bishop_offsets, queen_offsets];

        ctx.beginPath();
        ctx.fillStyle = "#d1d0cb";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.roundRect(P_BOARD_X, P_BOARD_Y, P_TILE_SIZE*2, P_TILE_SIZE*2, 5);
        ctx.stroke();
        ctx.fill();
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.moveTo(P_TILE_SIZE+P_BOARD_X, P_BOARD_Y);
        ctx.lineTo(P_TILE_SIZE+P_BOARD_X, 2*P_TILE_SIZE+P_BOARD_Y);
        ctx.moveTo(P_BOARD_X, P_TILE_SIZE+P_BOARD_Y);
        ctx.lineTo(2*P_TILE_SIZE+P_BOARD_X, P_TILE_SIZE+P_BOARD_Y);
        ctx.stroke();

        for(let i=0; i<4; i++){
            ctx.drawImage(document.getElementById("pieces"), 
                arr_offsets[i][0], arr_offsets[i][1], 
                IMG_SIZE, IMG_SIZE, 
                i%2*P_TILE_SIZE+P_BOARD_X+P_OFF_CENTER, (i+Math.floor(i/2))%2*P_TILE_SIZE+P_BOARD_Y+P_OFF_CENTER, 
                IMG_SCALE, IMG_SCALE);
        }
    }

    if(checkmated != "_"){
        ctx.fillStyle = "#d1d0cb";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(P_BOARD_X-P_TILE_SIZE, P_BOARD_Y, P_TILE_SIZE*4, P_TILE_SIZE*2, 5);
        ctx.stroke();
        ctx.fill();

        ctx.fillStyle = "#000000";
        ctx.font = "48px Tickerbit";
        if(client_color == checkmated) ctx.fillText("You Lose", P_BOARD_X, P_BOARD_Y+P_TILE_SIZE);
        else ctx.fillText("You Win", P_BOARD_X, P_BOARD_Y+P_TILE_SIZE);
    }
}

// Note: canvas coords are verticaly flipped on a chess board 
// Mouse down handles picking the promoted piece
function handleMouseDown(e){
    is_down = true;
    mouse_x = e.offsetX;
    mouse_y = e.offsetY;
    if(pawn_promoted){
        let x = Math.floor((mouse_x-P_BOARD_X)/P_TILE_SIZE);
        let y = Math.floor((mouse_y-P_BOARD_Y)/P_TILE_SIZE);
        if(x == 1 || x == 0 && y == 0 || y == 1) {
            switch (x+y*2){
                case 0:
                    promote_piece.piece = client_color+"R";
                    break;
                case 1:
                    promote_piece.piece = client_color+"Q";
                    break;
                case 2:
                    promote_piece.piece = client_color+"B";
                    break;
                case 3:
                    promote_piece.piece = client_color+"N";
                    break;
            }
            pawn_promoted = false;
            socket.emit("promote pawn", promote_piece);
        }
    }

    let x = Math.floor((mouse_x-BOARD_X)/TILE_SIZE);
    let y = Math.floor((mouse_y-BOARD_Y)/TILE_SIZE);
    if(x < 0 || x > 7 || y < 0 || y > 7) return;
    let piece = chess_board[y][x];
    if(piece == "__" || piece[0] != client_color || checkmated != "_") return;
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

socket.on("game update", (chess_board_server) => {
    chess_board.length = 0;
    for(let i=0; i<8; i++){
        chess_board.push(chess_board_server[i]);
    }
    if(client_color == "B"){
        chess_board.reverse();
        for(let i=0; i<8; i++){
            chess_board[i].reverse();
        }
    }
});

socket.on("assign color", (assigned_color) => {
    client_color = assigned_color;
})

socket.on("promote pawn", (x, y) => {
    pawn_promoted = true;
    promote_piece.x = x;
    promote_piece.y = y;
});

socket.on("checkmate", (checkmated_color) => {
    checkmated = checkmated_color;
});

canvas.onmousedown = handleMouseDown;
canvas.onmouseup = handleMouseUp;
canvas.onmouseleave = handleMouseLeave;
canvas.onmousemove = handleMouseMove;