import express from "express";
//var cors = require('cors')
import cors from "cors"
import pg from 'pg'
import dotenv from 'dotenv'
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import { workerData } from "node:worker_threads";
import { start } from "node:repl";
dotenv.config({path: "../.env"});
const app = express();
app.use(cors());
const server = createServer(app);
var clients = [];
var loggedInUsers = [];
var gameLobbies = [];
//let baseGame = 'dp_0-0,dp_0-1,dp_0-2,dp_0-3,dp_0-4,dp_0-5,dp_0-6,dp_0-7,dp_1-0,dp_1-1,dp_1-2,dp_1-3,dp_1-4,dp_1-5,dp_1-6,dp_1-7,lp_6-0,lp_6-1,lp_6-2,lp_6-3,lp_6-4,lp_6-5,lp_6-6,lp_6-7,lp_7-0,lp_7-1,lp_7-2,lp_7-3,lp_7-4,lp_7-5,lp_7-6,lp_7-7';
let curGameState = '';
const client = new pg.Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
  })
  await client.connect();



  const io = new Server(server, {
    cors: {
        origin: true,
        methods: ["GET", "POST"],
        allowedHeaders: ["Access-Control-Allow-Origin"],
        credentials: true,
      },
  connectionStateRecovery: {},
});

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

function checkGameLobbies(g){
    for(let i=0;i<gameLobbies.length;i++){
        if(gameLobbies[i].game==g.game && gameLobbies[i].lobby == g.lobby){
            return gameLobbies[i];
        }
    }
    return false;
}

app.get('/', (req, res) => {
    res.send('<h1>Checker Backend</h1>');
  });

io.on("connection",socket=>{

    let curLobby;
    let curGame;
    let curGameLobby;
    let curUser;
    let curOpponent;

    socket.on("start_game",()=>{
        socket.emit("game_update",baseGame);
    })
    
    socket.on("login",l=>{
        console.log("cur game is...");
        console.log(curGame);
        curGame = l.game;
        curLobby = l.lobby;
        curUser = l.user;
        
        let newGameLobby = new GameLobby(curGame,curLobby);
       if(checkGameLobbies(newGameLobby)==false){
        gameLobbies.push(newGameLobby);
        curGameLobby = newGameLobby;
        curGameLobby.addPlayer(l.user);
       } else {
        curGameLobby = checkGameLobbies(newGameLobby)
        curGameLobby.addPlayer(l.user);
       }

       //socket.emit()
         socket.join(`${l.lobby}-${l.game}`); 
         io.to(`${l.lobby}-${l.game}`).emit("gamelobby",curGameLobby);
         if(curUser==curGameLobby.players[0]){
            socket.emit("assign_color","lp");
            socket.emit("set_turn",true);
            curOpponent = 1;
         } else {
            socket.emit("assign_color","dp")
            socket.emit("set_turn",false);
            curOpponent = 0;
         }
         //gameLobbies
        
    })

    socket.on("made_turn",(g)=>{
        io.to(`${curLobby}-${curGame}`).emit("game_update",g.state);
        // let gameTime = Math.floor(Date.now() / 1000) - startTime;
        // let str_min = Math.floor(gameTime/60).toString();
        // let str_sec = (gameTime%60).toString();
        // let game_time = "game_time: " + str_min + "m" + str_sec + "s";
        updateTurn(g,curGame);
        console.log("gmae updated in sql?");
        
        io.to(`${curLobby}-${curGame}`).emit("setPlayerTurn",curGameLobby.players[curOpponent]);
    })
})

async function updateTurn(g,gid){
    try{
        let args = [g.state, gid];
        //await client.connect();
        console.log(`game id ${gid}  \n state updated ${g}`);
        console.log(gid);
        console.log(g);
        await client.query("UPDATE public.\"GameInst\" set move_hist=array_append(move_hist,$1) WHERE game_id=$2;", args);
    } catch(e){
        console.log("update error",e);
    }
}

server.listen(3001, () => {
    console.log("server running at http://localhost:3001");
  });