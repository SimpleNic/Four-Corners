var username = '';
let attemptedUsername = '';
var lobbyEmpty = true;
var loggedIn = false;
var isHost = false;
var isHostee = false;
var curLobby = {
    host:"",
    hostee:""
}
const socket = io("localhost:3000", {
    withCredentials: true,
    extraHeaders: {
      "Access-Control-Allow-Origin":'*'
    }
  });
var login_status = document.getElementById("login-status");
const loginButton = document.getElementById("login-button")
const loginField = document.getElementById("login-field");
const avi = document.getElementById("avi");
const uname = document.getElementById("uname");
const makeLobby = document.getElementById("create-lobby");
const lobbyList = document.getElementById("open-lobbies");
const makeGameButton = document.getElementById("play-game-checkers");
const joinGameLink = document.getElementById("join-game");
const playerlist = document.getElementById("player-list")
var hostPowers = false;
loginButton.addEventListener("click",()=>{

    console.log("click'd");
    login(loginField.value);
})

makeLobby.addEventListener("click",()=>{
    if(loggedIn){
        createLobby();
    }
})

makeGameButton.addEventListener("click",()=>{
    if(isHost){
        socket.emit("start_game",makeGameButton.innerText.toLowerCase())
    }


})
function login(uname){
    console.log(uname);
    socket.emit("login",uname);
     username = uname;
}

function logout(){
    loggedIn = false;
    socket.emit("logout",username);
}


socket.on("login_failed",u=>{
    if(!loggedIn){
        login_status.innerText = "Login failed... try again!";
        username = '';
    }
})

socket.on("login_success",u=>{
    login_status.innerText = "Logged in!";
    loggedIn = true;
})

socket.on("client_data",d=>{
    console.log(d);
    uname.innerText = `${d.u_name} ELO:${d.elo}`;
    avi.src = `../img/${d.u_picture.slice(0,-4)}.png`
})

function joinLobby(host){
    console.log(host);
    socket.emit("join_lobby",host)
}

socket.on("lobby_update",u=>{
    console.log(u.type);
    switch(u.type){
        case "lobby_full":
            console.log("hmm...");
            console.log("the host is: "+u.host);
            if(lobbyEmpty){
                lobbyEmpty = false;
                curLobby.host = u.host;
                curLobby.hostee = u.hostee;
            if(u.host==username){
                console.log("you are the host");
                isHost = true;
                initLobby();
                addPlayer(u.hostee);
            }
            if(u.hostee==username){
                isHostee = true;
                console.log("you are the hostee");
                addPlayer(u.host);
                addPlayer(username);
            }
        
        }
            //hostPowers = true;
            break;
        case "new_lobby":
            lobbyUpdate();
            break;
        case "populate":
            u.data.forEach(l=>{
                if(l.host!=''){
                    lobbyList.innerHTML += `<div class="${l.host}">${l.host}'s Lobby <button class="${l.host}-join" id="${l.host}-join" onclick=joinLobby("${l.host}")>Join Lobby!</button></div>`
                  //  document.getElementById(`${l.host}-join`).addEventListener("click",joinLobby(l.host));
                }
            })    
        break;
    }

    

})

socket.on("roomtest!",()=>{
    console.log("only the cool kids got this one!");
})

socket.on("game_made",(game)=>{
    joinGameLink.href = window.location.origin + `/${game.game}/${game.game}.html?user=${username}&lobby=${game.lobby_id}&game=${game.game_id}`
    joinGameLink.innerText = "Join this game!";
})

function createLobby(){
    socket.emit("create_lobby");
    addPlayer(username);
}

function lobbyUpdate(){
    lobbyList.innerHTML = "";
    socket.emit("lobby_populate");
}

function initLobby(){
    socket.emit("get_lobby",{u1:curLobby.host,u2:curLobby.hostee}) 
    console.log("getting lobbyyyy");
    socket.on("lobby_info",d=>{
        console.log(d);
    })

}

function addPlayer(p){
    playerlist.innerHTML += `<p> ${p} </p>`
}

function createGame(){

}

