import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import pg from 'pg';
import dotenv from 'dotenv'; 

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
      origin: true,
      methods: ["GET", "POST"],
      allowedHeaders: ["Access-Control-Allow-Origin"],
      credentials: true,
    },
connectionStateRecovery: {},
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const __publicPath = join(__dirname, "public");
app.use(express.static(__publicPath));

dotenv.config({path: "../.env"});

const CLIENT_ARGS = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
};



//
// Postgresql
//



var startTime = Math.floor(Date.now() / 1000);
const gameMoves = [];

async function gameEnd(){
  let client = new pg.Client(CLIENT_ARGS);
  try{
    let gameTime = Math.floor(Date.now() / 1000) - startTime;
    let str_min = Math.floor(gameTime/60).toString();
    let str_sec = (gameTime%60).toString();
    let game_time = "game_time: " + str_min + "m" + str_sec + "s";
    let moves_played = "moves_played: " + gameMoves.length;
    let game_stats = [game_time, moves_played]

    let args = [game_stats, gameMoves, game_id];
    await client.connect();
    await client.query("UPDATE public.\"GameInst\" SET game_stats=$1, move_hist=$2 WHERE game_id=$3;", args);
  }
  catch (e){
      console.log("OH NO!", e);
  }
  finally{
      await client.end();
  }
}

function GameLobby(game,lobby){
  this.game = game;
  this.lobby = lobby;
  this.players = [];
  this.addPlayer = function(player){
      if(this.players.length<2 || !this.players.includes(player)){
          this.players.push(player);
      }
  }
}



//
// Server side checks
//



var turn = "W";
var checkmated = "_";
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
];

// Checks if move is valid
// ghost_piece, x_dest, and y_dest are relative coordinates, 
// white has same relative and absolute coordinates, but black has it fliped
function move(ghost_piece, x_dest, y_dest, real_move = true){
  let moved = false;
  let color = ghost_piece.piece[0];
  let x_dist = ghost_piece.x-x_dest;
  let y_dist = ghost_piece.y-y_dest;
  let start_board = getBoardCoords(color, ghost_piece.x, ghost_piece.y);
  let dest_board = getBoardCoords(color, x_dest, y_dest);

  if(!isSpacesEmpty(color, start_board, dest_board) || isSelfCheck(ghost_piece.piece, start_board, dest_board)) return false;

  switch (ghost_piece.piece[1]){
    case "P":
      moved = movePawn(ghost_piece.y, x_dist, y_dist, dest_board, real_move);
      break;
    case "N":
      moved = moveKnight(x_dist, y_dist);
      break;
    case "B":
      moved = moveBishop(x_dist, y_dist);
      break;
    case "R":
      moved = moveRook(x_dist, y_dist);
      // remove castle options if rook moved
      if(moved && real_move){
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
      moved = moveQueen(x_dist, y_dist);
      break;
    case "K":
      moved = moveKing(x_dist, y_dist, color, real_move);
      // remove castle options if king moved
      if(moved && real_move){
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
  return moved;
}

// movePawn is the strangest due to all the special things it can do,
// real_move is used when you want to see if a pawn can do something
// without updating pawn_can_be_enpassant
function movePawn(y_start, x_dist, y_dist, dest_board, real_move = true){
  // Simple move forward
  if(x_dist == 0 && y_dist == 1 && chess_board[dest_board.y][dest_board.x] == "__") return true;

  // Capture
  if(Math.abs(x_dist) == 1 && y_dist == 1 && chess_board[dest_board.y][dest_board.x] != "__") return true;

  // En passant
  if(Math.abs(x_dist) == 1 && y_dist == 1 && 
    pawn_can_be_enpassant.turn_ctr == 0 && 
    Math.abs(dest_board.y-pawn_can_be_enpassant.y) == 1 &&
    dest_board.x == pawn_can_be_enpassant.x) {
      if(real_move) chess_board[pawn_can_be_enpassant.y][pawn_can_be_enpassant.x] = "__";
      return true;
    }

  // First move can move two space
  if(x_dist == 0 && y_start == 6 && y_dist == 2) {
    if(real_move){
      pawn_can_be_enpassant.x = dest_board.x;
      pawn_can_be_enpassant.y = dest_board.y;
      pawn_can_be_enpassant.turn_ctr = 1;
    }
    return true;
  }
  return false;
}

function moveKnight(x_dist, y_dist){
  if(Math.abs(x_dist) == 1 && Math.abs(y_dist) == 2 || Math.abs(x_dist) == 2 && Math.abs(y_dist) == 1) return true;
  return false;
}

function moveBishop(x_dist, y_dist){
  if(Math.abs(x_dist) == Math.abs(y_dist)) return true;
  return false;
}

function moveRook(x_dist, y_dist){
  if(x_dist == 0 && y_dist != 0 || x_dist != 0 && y_dist == 0) return true;
  return false;
}

function moveQueen(x_dist, y_dist){
  if(Math.abs(x_dist) == Math.abs(y_dist) || x_dist == 0 && y_dist != 0 || x_dist != 0 && y_dist == 0) return true;
  return false;
}

function moveKing(x_dist, y_dist, color = "_", real_move=true){
  if(Math.abs(x_dist) <= 1 && Math.abs(y_dist) <= 1) return true;
  if(!real_move) return false;
  // Castle
  if(color == "W" && x_dist == 2 && white_castle.left) {
    if(isSelfCheck("WK", {x:4, y:7}, {x:3, y:7})) return false;
    chess_board[7][0] = "__";
    chess_board[7][3] = "WR";
    return true;
  }
  if(color == "W" && x_dist == -2 && white_castle.right) {
    if(isSelfCheck("WK", {x:4, y:7}, {x:5, y:7})) return false;
    chess_board[7][7] = "__";
    chess_board[7][5] = "WR";
    return true;
  }
  if(color == "B" && x_dist == -2 && black_castle.left) {
    if(isSelfCheck("BK", {x:4, y:0}, {x:3, y:0})) return false;
    chess_board[0][0] = "__";
    chess_board[0][3] = "BR";
    return true;
  }
  if(color == "B" && x_dist == 2 && black_castle.right) {
    if(isSelfCheck("BK", {x:4, y:0}, {x:5, y:0})) return false;
    chess_board[0][7] = "__";
    chess_board[0][5] = "BR";
    return true;
  }
  return false;
}

// Gets absolute board coords
function getBoardCoords(color, x, y){
  if(color == "B") return {x: 7-x, y: 7-y};
  return {x: x, y: y};
}

// isSpacesEmpty checks all diagonal, horizontal, or vertical spaces between start and destination,
// then it checks if destination space doesn't have a same color piece on it,
// all other moves only check the destination space
function isSpacesEmpty(color, start_board, dest_board, board_state = chess_board){
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
      if(board_state[y_pos][x_pos] != "__") return false;
    }
  }
  if(board_state[dest_board.y][dest_board.x][0] == color) return false;
  return true;
}

// isSelfCheck checks the color's king to see if any 
// enemy pieces will check if the move is made
function isSelfCheck(piece, start_board = null, dest_board = null){
  let color = piece[0];
  let king_pos = {x:NaN, y:NaN};
  let future_board = [];
  let other_color = "W";
  if(color == "W") other_color = "B";

  for(let i=0; i<8; i++){
    future_board.push(chess_board[i].slice());
  }

  if(start_board != null && dest_board != null){
    future_board[start_board.y][start_board.x] = "__";
    future_board[dest_board.y][dest_board.x] = piece; 
  }

  for(let i=0; i<8; i++){
    for(let j=0; j<8; j++){
      if(color+"K" == future_board[i][j]) {
        king_pos.x = j; 
        king_pos.y = i;
      }
    }
  }

  for(let i=0; i<8; i++){
    for(let j=0; j<8; j++){
      if(other_color == future_board[i][j][0]) {
        let x_dist = j-king_pos.x;
        let y_dist = i-king_pos.y;
        if(other_color == "B"){
          x_dist *= -1;
          y_dist *= -1;
        }
        if(isSpacesEmpty(other_color, {x:j, y:i}, king_pos, future_board) && 
          (future_board[i][j] == other_color+"Q" && moveQueen(x_dist, y_dist) ||
          future_board[i][j] == other_color+"R" && moveRook(x_dist,y_dist) ||
          future_board[i][j] == other_color+"B" && moveBishop(x_dist,y_dist) ||
          future_board[i][j] == other_color+"N" && moveKnight(x_dist,y_dist) ||
          future_board[i][j] == other_color+"K" && moveKing(x_dist,y_dist) ||
          future_board[i][j] == other_color+"P" && Math.abs(x_dist) == 1 && y_dist == 1)) return true;
      }
    }
  }
  return false;
}

// isEnemyCheckmate checks if enemy is checkmated
function isEnemyCheckmate(self_color){
  let enemy_color = "W";
  let xyOffset = 0;
  if(self_color == enemy_color) {
    xyOffset = 7;
    enemy_color = "B";
  }
  if(!isSelfCheck(enemy_color+"_")) return false;

  // yep check every piece of black going into 
  // all 64 spaces to see if it stops the check
  for(let i=0; i<8; i++){
    for(let j=0; j<8; j++){
      if(enemy_color == chess_board[i][j][0]) {
        let ghost_piece = {piece: chess_board[i][j], x: Math.abs(xyOffset-j), y: Math.abs(xyOffset-i)};
        for(let y=0; y<8; y++){
          for(let x=0; x<8; x++){
            if(move(ghost_piece, Math.abs(xyOffset-x), Math.abs(xyOffset-y), false)) return false;
          }
        }
      }
    }
  }
  checkmated = enemy_color;
  return true;
}



//
// Socket.io stuff
//



io.on("connection", (socket) => {
  // Assign colors
  if(assigned_colors.length < 2){
    let color = "W";
    if(assigned_colors.length == 1 && assigned_colors[0].color == "W") color = "B";
    assigned_colors.push({id:socket.id, color:color});
    socket.emit("assign color", color);
    console.log("a player connected:", assigned_colors[assigned_colors.length-1]);
  }
  
  // Setup game
  io.emit("game update", chess_board);
  io.emit("checkmate", checkmated);

  // Update after each move
  socket.on("game update", (ghost_piece, x_dest, y_dest) => {
    let color = ghost_piece.piece[0];
    if(assigned_colors.length != 2 || !move(ghost_piece, x_dest, y_dest) || color != turn) {
      io.emit("game update", chess_board);
      return;
    }
    pawn_can_be_enpassant.turn_ctr--;
    let dest_board = getBoardCoords(color, x_dest, y_dest);
    let start_board = getBoardCoords(color, ghost_piece.x, ghost_piece.y);
    chess_board[dest_board.y][dest_board.x] = ghost_piece.piece;
    chess_board[start_board.y][start_board.x] = "__";

    gameMoves.push(start_board.x.toString() + start_board.y.toString() + ghost_piece.piece + dest_board.x.toString() + dest_board.y.toString());

    // Special promote function
    if(ghost_piece.piece[1] == "P" && y_dest == 0) socket.emit("promote pawn", x_dest, y_dest);
    else if(turn == "W") turn = "B";
    else if(turn == "B") turn = "W";
    io.emit("game update", chess_board);

    if(isEnemyCheckmate(color)) {
      io.emit("checkmate", checkmated);
      gameEnd();
    }
  });

  // Promote pawn
  socket.on("promote pawn", (promote_piece) => {
    let color = promote_piece.piece[0];
    let promote_board = getBoardCoords(color, promote_piece.x, promote_piece.y);
    chess_board[promote_board.y][promote_board.x] = promote_piece.piece;

    gameMoves[gameMoves.length-1] = gameMoves[gameMoves.length-1][0] + gameMoves[gameMoves.length-1][1] + promote_piece.piece + gameMoves[gameMoves.length-1][4] + gameMoves[gameMoves.length-1][5];

    io.emit("game update", chess_board);
    if(turn == "W") turn = "B";
    else if(turn == "B") turn = "W";

    if(isEnemyCheckmate(color)) {
      io.emit("checkmate", checkmated);
      gameEnd();
    }
  });

  socket.on("login", (login_par) => {
    let newGameLobby = new GameLobby(login_par.game,login_par.lobby);
    socket.join(`${login_par.lobby}-${login_par.game}`); 
    io.to(`${login_par.lobby}-${login_par.game}`).emit("gamelobby", newGameLobby);
  });

  // Handle disconnects 
  socket.on("disconnect", () => {
    if(assigned_colors.length == 1){
      assigned_colors.length = 0;
      console.log("player disconnected:", socket.id);
    }
    else if(assigned_colors.length == 2 && assigned_colors[0].id == socket.id){
      assigned_colors[0] = assigned_colors[1];
      assigned_colors.length = 1;
      console.log("player disconnected:", socket.id);
    }
    else if(assigned_colors.length == 2 && assigned_colors[1].id == socket.id){
      assigned_colors.length = 1;
      console.log("player disconnected:", socket.id);
    }
  });
});

server.listen(3002, () => {
  console.log("server running at http://localhost:3002");
});
