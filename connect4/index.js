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

var aBoard = [[0,0,0,1,0,0,0],
                [0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0]];

var clearBoard = [[0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0]];
var lobby_id;

io.on('connection', function(socket) 
{
    aBoard = clearBoard.slice();
    io.emit('onload board', aBoard);
    socket.on('next turn', (server_board) =>{
        aBoard = server_board.slice();
        io.emit('onload board', aBoard);
        sendGameStats();
    });
    socket.on('winner', (server_board) => {
        aBoard = server_board.slice();
        io.emit('winner reset', aBoard);
    });
    socket.on('lobby_id', (server_lobby_id) => {
        lobby_id = server_lobby_id.slice();
    })
});

async function sendGameStats()
{
    let client = new pg.Client(CLIENT_ARGS);
    let args = [aBoard, lobby_id];
    try
    {
        await client.query("UPDATE public.\"GameInst\" set move_hist=array_append(move_hist,$1) WHERE game_id=$2;", args);
    }
    catch(e){
        console.log("update error",e);
    }
}

server.listen(3003, () => {
    console.log("server running at http://localhost:3003");
});
