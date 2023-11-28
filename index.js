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

var pawn_can_be_enpassant = {
  x: NaN,
  y: NaN,
  turn_ctr: 0,
};

// rook and king can castle only if they have not moved yet
var white_castle = {
  left: true,
  right: true,
};
var black_castle = {
  left: true,
  right: true,
};

const assigned_colors = [];

// "__" = no piece
// "BQ" = black queen
// "WP" = white pawn
const chess_board = [
  ["BR","BN","BB","BQ","BK","BB","BN","BR"],
  ["BP","BP","BP","BP","BP","BP","BP","BP"],
  ["__","__","__","__","__","__","__","__"],
  ["__","__","__","__","__","__","__","__"],
  ["__","__","__","__","__","__","__","__"],
  ["__","__","__","__","__","__","__","__"],
  ["WP","WP","WP","WP","WP","WP","WP","WP"],
  ["WR","WN","WB","WQ","WK","WB","WN","WR"],
]

// Checks if move is valid
// ghost_piece, x_dest, and y_dest are relative coordinates, 
// white has same relative and absolute coordinates, but black has it fliped
function move(ghost_piece, x_dest, y_dest){
  let moved = false;
  let color = ghost_piece.piece[0];
  let x_dist = ghost_piece.x-x_dest;
  let y_dist = ghost_piece.y-y_dest;
  let start_board = getBoardCoords(color, ghost_piece.x, ghost_piece.y);
  let dest_board = getBoardCoords(color, x_dest, y_dest);

  if(!isSpacesEmpty(color, start_board, dest_board) || isSelfCheck(color, start_board, dest_board)) return false;

  switch (ghost_piece.piece[1]){
    case "P":
      moved = movePawn(ghost_piece.y, x_dist, y_dist, dest_board);
      break;
    case "N":
      moved = moveKnight(x_dist, y_dist, dest_board);
      break;
    case "B":
      moved = moveBishop(x_dist, y_dist, dest_board);
      break;
    case "R":
      moved = moveRook(x_dist, y_dist, dest_board);
      if(moved){
        if(color == "W") {
          if(start_board.x == 0) white_castle.left = false; 
          else if(start_board.x == 7) white_castle.right = false;
        }
        else if(color == "B"){
          if(start_board.x == 0) black_castle.left = false; 
          else if(start_board.x == 7) black_castle.right = false;
        }
      }
      break;
    case "Q":
      moved = moveQueen(x_dist, y_dist, dest_board);
      break;
    case "K":
      moved = moveKing(x_dist, y_dist, dest_board);
      if(moved){
        if(color == "W") {
          white_castle.left = false; 
          white_castle.right = false;
        }
        else if(color == "B"){
          black_castle.left = false; 
          black_castle.right = false;
        }
      }
      break;
  }
  if(moved) pawn_can_be_enpassant.turn_ctr--; 
  return moved;
}



function movePawn(y_start, x_dist, y_dist, dest_board){
  // Simple move forward
  if(x_dist == 0 && y_dist == 1 && chess_board[dest_board.y][dest_board.x] == "__") return true;

  // Capture
  if(Math.abs(x_dist) == 1 && y_dist == 1 && chess_board[dest_board.y][dest_board.x] != "__") return true;

  // En passant
  if(Math.abs(x_dist) == 1 && y_dist == 1 && pawn_can_be_enpassant.turn_ctr == 0 && chess_board[dest_board.y][dest_board.x] != "__")

  // First move can move two space
  if(x_dist == 0 && y_start == 6 && y_dist == 2) {
    pawn_can_be_enpassant.x = dest_board.x;
    pawn_can_be_enpassant.y = dest_board.y;
    pawn_can_be_enpassant.turn_ctr = 1;
    return true;
  }
  
  return false;
}

function moveKnight(x_dist, y_dist, dest_board){
  return false;
}

function moveBishop(x_dist, y_dist, dest_board){
  return false;
}

function moveRook(x_dist, y_dist, dest_board){

  return false;
}

function moveQueen(x_dist, y_dist, dest_board){
  return false;
}

function moveKing(x_dist, y_dist, dest_board){
  
  return false;
}


function getBoardCoords(color, x, y){
  if(color == "B") return {x: 7-x, y: 7-y};
  return {x: x, y: y};
}



// isSpacesEmpty checks all diagonal, horizontal, or vertical spaces between start and destination,
// then it checks if destination space doesn't have a same color piece on it,
// all L moves only check the destination space
function isSpacesEmpty(color, start_board, dest_board){
  let x_dist = start_board.x-dest_board.x;
  let y_dist = start_board.y-dest_board.y;
  if(Math.abs(x_dist) == Math.abs(y_dist) || x_dist == 0 && y_dist != 0 || x_dist != 0 && y_dist == 0){
    while(x_dist != 0 || y_dist != 0){
      if      (x_dist < 0) x_dist++;
      else if (x_dist > 0) x_dist--;
      if      (y_dist < 0) y_dist++;
      else if (y_dist > 0) y_dist--;

      let x_pos = dest_board.x+x_dist;
      let y_pos = dest_board.y+y_dist;
      if(x_dist == 0 && y_dist == 0) break;
      if(chess_board[y_pos][x_pos] != "__") return false;
    }
  }
  if(chess_board[dest_board.y][dest_board.x][0] == color) return false;
  return true;
}

// isSelfCheck checks the color's king to see if any enemy pieces will
// be able to check if the move is made
function isSelfCheck(color, start_board, dest_board){

}




















io.on("connection", (socket) => {
  // assign colors
  if(assigned_colors.length < 2){
    let color = "W"
    if(assigned_colors.length == 1)
      if(assigned_colors[0].color == "W") color = "B"
    assigned_colors.push({id:socket.id, color:color})
    socket.emit("assign color", color);
    console.log("a player connected:", assigned_colors[assigned_colors.length-1]);
  }

  // setup game
  io.emit("game update", chess_board);

  // update after each move
  socket.on("game update", (ghost_piece_rec, x_dest, y_dest) => {
    if(!move(ghost_piece_rec, x_dest, y_dest)) {
      io.emit("game update", chess_board);
      return;
    }
    let color = ghost_piece_rec.piece[0];
    let dest_board = getBoardCoords(color, x_dest, y_dest);
    let ghost_board = getBoardCoords(color, ghost_piece_rec.x, ghost_piece_rec.y);
    chess_board[dest_board.y][dest_board.x] = ghost_piece_rec.piece;
    chess_board[ghost_board.y][ghost_board.x] = "__";

    io.emit("game update", chess_board);
  });

  // handle disconnects 
  socket.on("disconnect", () => {
    if(assigned_colors.length > 0 && assigned_colors[0].id == socket.id){
      assigned_colors[0] = assigned_colors[1];
      assigned_colors.length = 1;
      console.log("player disconnected:", socket.id);
    }
    else if(assigned_colors.length > 1 && assigned_colors[1].id == socket.id){
      assigned_colors.length = 1;
      console.log("player disconnected:", socket.id);
    }

  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
