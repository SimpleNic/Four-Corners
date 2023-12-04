import express from "express";
//var cors = require('cors')
import cors from "cors"
import pg from 'pg'
import dotenv from 'dotenv'
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
dotenv.config();
const app = express();
app.use(cors());
const server = createServer(app);
var clients = [];
var loggedInUsers = [];
var lobbies = [];

function Lobby(host){
  this.host = host;
  this.count = 1;
  this.hostee;
  this.addPlayer = function(player){
    this.hostee = player;
  }


}



const io = new Server(server, {
    cors: {
        origin: true,
        methods: ["GET", "POST"],
        allowedHeaders: ["Access-Control-Allow-Origin"],
        credentials: true,
      },
  connectionStateRecovery: {},
});

const client = new pg.Client({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
})
await client.connect();


async function getUserData(username,socket){
  try{
  let res = await client.query(`SELECT * FROM public.\"Uprofile\" WHERE u_name='${username}'` );
  console.log(res.rows);
  socket.emit("client_data",res.rows[0]);
  }
  catch (e){
      console.log("bad thing", e);
  }
  // finally{
  //     await client.end();
  // }
  
}
async function createNewLobby(uname1, uname2){
  try{
    let res = await client.query(`with maxLobby as (select Max(lobby_id) from "Lobby")
    INSERT INTO public."Lobby"(
      "specWL_ratio1","specWL_ratio2"
      ,u_name1, u_name2, lobby_id)
    VALUES (0,0,'${uname1}', '${uname2}', (select * from maxLobby)+1);`)

  } catch(e){
    console.log("ermmm",e)
  }
}

async function getLobbyData(uname1,uname2){
  try{
    let res = await client.query(`SELECT lobby_id
    FROM public."Lobby"
    WHERE (u_name1 = '${uname1}' OR u_name2 = '${uname1}') AND (u_name1 = '${uname2}' OR
    u_name2 = '${uname2}');` );
    console.log(res.rows);
    if(res.rows.length == 0){
      console.log("no such lobby")
      console.log(uname1); console.log(uname2);
      createNewLobby(uname1,uname2);
    } else {
      console.log("lobby found!")
      console.log(res.rows);
    }
    return res.rows;
    //socket.emit("client_data",res.rows[0]);
    }
    catch (e){
        console.log("bad thing", e);
    }

}



io.on("connection", (socket) => {
  let socketUser = '';
  let loggedIn = false;
    console.log(`Socket connected! ${socket}`)  
    //console.log(socket);
    //clients.push(socket.id);
    socket.on("disconnect",(d)=>{
        console.log("socket disconnected...")
        if(loggedIn){
          loggedInUsers.splice(loggedInUsers.indexOf(socketUser),1);
        
        }

        lobbies.forEach(l=>{
          if(l.host == socketUser){
            l.host = "";
          }
        })
        loggedIn = false;
        socketUser = '';

    })



    socket.on("player_connect",(d)=>{
      console.log("")
    })

    socket.on("socko",()=>{
      socket.emit("socku",socketUser)
    })

    socket.on("login",(u)=>{
      console.log(u+"has tried to login!");
      console.log(u)
      if(loggedInUsers.includes(u)){
        console.log(u);
        console.log("login failed....")
        socket.emit("login_failed",u);
      } else {
        getUserData(u,socket);
        loggedIn = true;
        loggedInUsers.push(u);
        socket.emit("login_success",u);
        console.log(`${u} has succesfully logged in!`);
        socket.emit("lobby_update",{type:"populate",data:lobbies})
       
        socketUser = u;
      }

    })

    socket.on("create_lobby",()=>{
      
      let exists = false;
      lobbies.forEach(l=>{
        if(l.host==socketUser){
          console.log(l);
          exists = true;
        }
      })

      if(!exists){
        let newLobby = new Lobby(socketUser);
        lobbies.push(newLobby);
      io.emit("lobby_update",{type:"new_lobby", new_lobby:newLobby});
      }
    
    })

    socket.on("join_lobby",(l)=>{
      console.log("attempty lobby join...")
      for(let i=0;i<lobbies.length;i++){
        if(lobbies[i].host==l){
          lobbies[i].addPlayer(socketUser);
          console.log(`${socketUser} Joined ${l}'s lobby!`)
          io.emit("lobby_update",{type:"lobby_full",host:l,hostee:lobbies[i].hostee});
        }
      }
    })

    socket.on("lobby_populate",()=>{
      socket.emit("lobby_update",{type:"populate",data:lobbies})
    })


socket.on("get_lobby",(d)=>{
  socket.emit("lobby_info",getLobbyData(d.u1,d.u2));
})

   



})



app.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>');
  });

server.listen(3000, () => {
    console.log("server running at http://localhost:3000");
  });


