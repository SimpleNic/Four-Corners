import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";

const canvas = document.getElementById("game-canvas");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const __publicPath = join(__dirname, "public");
app.use(express.static(__publicPath));

io.on("connection", (socket) => {
    // Assign colors
    if(assigned_colors.length < 2){
      let color = "R";
      if(assigned_colors.length == 1 && assigned_colors[0].color == "R") color = "B";
      assigned_colors.push({id:socket.id, color:color});
      socket.emit("assign color", color);
      console.log("a player connected:", assigned_colors[assigned_colors.length-1]);
    }
});

canvas.onmousedown = handleMouseDown;