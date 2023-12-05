import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";

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


io.on('connection', function(socket) 
{
    aBoard = clearBoard.slice();
    io.emit('onload board', aBoard);
    socket.on('next turn', (server_board) =>{
        aBoard = server_board.slice();
        io.emit('onload board', aBoard);
    });
    socket.on('winner', (server_board) => {
        aBoard = server_board.slice();
        io.emit('winner reset', aBoard);
    });
});

server.listen(3003, () => {
    console.log("server running at http://localhost:3003");
});

