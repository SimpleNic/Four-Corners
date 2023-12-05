document.on
var board;
//var baseGame = 'dp_0-0,dp_0-1,dp_0-2,dp_0-3,dp_0-4,dp_0-5,dp_0-6,dp_0-7,dp_1-0,dp_1-1,dp_1-2,dp_1-3,dp_1-4,dp_1-5,dp_1-6,dp_1-7,lp_6-0,lp_6-1,lp_6-2,lp_6-3,lp_6-4,lp_6-5,lp_6-6,lp_6-7,lp_7-0,lp_7-1,lp_7-2,lp_7-3,lp_7-4,lp_7-5,lp_7-6,lp_7-7';
var baseGameState = ""
var username = "gamer1";
var opponent;
var lobby_id;
var game_id;
var turn_indicator;

var turn = false;
var selectedPeice;
var newPos;
var homePeice = 'lp';
var red = [];
var enemyPeice = 'dp';

const socket = io("localhost:3001", {
  withCredentials: true,
  extraHeaders: {
    "Access-Control-Allow-Origin":'*'
  }
});
document.addEventListener("DOMContentLoaded", function(){
    //....
turn_indicator = document.getElementById("cur-turn");
color_indicator = document.getElementById("cur-color");
board = document.getElementById('board');

for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {

       

        const square = document.createElement('div');
        square.classList.add('square');
        if ((i + j) % 2 === 0) {
            square.classList.add('light');
        } else {
            square.classList.add('dark');
            
            if(i<=1){
                baseGameState += `dp_${i}-${j},`
            }
    
            if(i>=6){
                baseGameState += `lp_${i}-${j},`
            }
    
        }
        square.id = i+"-"+j

        square.addEventListener("click",(e)=>{
            console.log("clicked!");
            console.log(e.target.innerText);
            boxClicked(e.target);
        })

        board.appendChild(square);
        
    }
}
baseGameState = baseGameState.slice(0,-1);

const params = new URLSearchParams(window.location.search);
username = params.get("user");
lobby_id = params.get("lobby");
game_id = params.get("game");

socket.emit("login",{user:username,lobby:lobby_id,game:game_id});
 updateBoard(baseGameState)
 //socket.emit("start_game")

});



function clearBoard() {
    let squares = document.getElementsByClassName("square");
   for(square in squares){
    squares[square].innerText = " ";
   }
}


function updateBoard(gamestate){
  clearBoard();
    let gs = gamestate.split(",")
    gs.forEach(element => {
        let g = element.split("_")
        let curPos = g[1];
        let boardPos = document.getElementById(curPos);
        boardPos.innerText = g[0];
    });
}
var test;

var placing = false;
var myTurn = true;
function boxClicked(spot){
   
   if(turn){
    console.log(spot.id);
    console.log(spot.innerText);
    let selPosStr = spot.id;
    let selPos = selPosStr.split("-");
    selPos[0] = +selPos[0];
    selPos[1] = +selPos[1];
    console.log("selpos is "+selPos);
    let selPeice = spot.innerText;
    
    for(let i=0;i<red.length;i++){
        if(red[i].id == selPosStr){
            red[i].innerText = selectedPeice.innerText;
            selectedPeice.innerText = "";
            console.log(writeGameState());
            socket.emit("made_turn",{state:writeGameState(),player:username});
            turn = false;
            console.log("turn made");
            break;
        }
    }

    console.log("hmm");
    
    clearRed();
    
    let newRow;
    let newCol1;
    let newCol2;
    if(selPeice == homePeice){

        selectedPeice = document.getElementById(selPosStr);
        if(homePeice == "dp"){
         newRow = selPos[0]+1;
         newCol1 = selPos[1]+1;
         newCol2 = selPos[1]-1;
        } else{
         newRow = selPos[0]-1;
         newCol1 = selPos[1]+1;
         newCol2 = selPos[1]-1;  
        }
        if( (0 < newRow < 7)){
        //console.log(`${selPos[0]+1}-${selPos[1]+1}`);
        if((0 <= newCol1 && newCol1 <= 7)){ 
            console.log("newRow is: "+newRow)
            console.log("newcol1 is: "+newCol1);
            console.log(`${newRow}-${newCol1}`)
        let legalPos1 =  document.getElementById(`${newRow}-${newCol1}`)
        test=legalPos1;
        if(!legalPos1.classList.contains("legal") && legalPos1.innerText==""){
            legalPos1.classList.add("legal");
            red.push(legalPos1);
        }}
        if((0<=newCol2 && newCol2<=7)){
            console.log("newcol2 is: "+newCol2);
            let legalPos2 =  document.getElementById(`${newRow}-${newCol2}`)
            if(!legalPos2.classList.contains("legal") && legalPos2.innerText==""){
                legalPos2.classList.add("legal");
                red.push(legalPos2);
            }
        }
      
    }

        
       
    }
    console.log(red);
    }


    
    //spot.classList.add("legal");
    
    // if(placing){
    //     if(legal){
    //         changeGameState();
    //     }
    // }
}

function checkLegalSpots(cur){
    let legalMoves = [];
   
}

function waitForOpponent(){

}

function writeGameState(){
    let squares = document.getElementsByClassName("square");
    let newGameState = "";
    for(square of squares){
        if(!square.innerText==""){
            newGameState+=`${square.innerText}_${square.id},`;
        }
    }
    newGameState = newGameState.slice(0,-1);
    return newGameState;
}

function clearRed(){
    for(let i=0;i<red.length;i++){
        red[i].classList.remove("legal");
    }

    red = [];
//     let squares = document.getElementsByClassName("legal");
  
//    console.log(squares);
//     for(square of squares){
//      console.log("hi");
//         console.log(square);
//      square.classList.remove("legal");
//     }


}

socket.on("game_update",u=>{
    console.log("got a socket update!");
    updateBoard(u);
})

socket.on("hello",()=>{
    console.log("hi!")
})

socket.on("gamelobby",(g)=>{
    console.log(g.players);
})

socket.on("set_turn",(t)=>{
    turn = t;
    console.log("setting turn!");
    if(t){
        turn_indicator.innerText = "It's your turn!";

    } else {
        turn_indicator.innerText = "It's not your turn yet";
    }
})

socket.on("setPlayerTurn",(p)=>{
    console.log(p);
    if(p==username){
    if(turn){
        turn = false;
        turn_indicator.innerText = "It's not your turn yet";
    } else {
        turn = true;
        turn_indicator.innerText = "It's your turn!";
        }
    }
})

socket.on("assign_color",(c)=>{
    homePeice = c;
    color_indicator.innerText = `Your color is ${c}`;
    //console.log("i am:")
})

// function login(){
//     socket.emit("login",username);
// }

