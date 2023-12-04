const socket = io();
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

canvas.onmousedown = handleMouseDown;