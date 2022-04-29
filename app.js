const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

// const path = require('path');
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static("public"));
app.use("/public", express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//
const db = require("./DB");
//

server.listen((port = 80), function () {
  console.log("port:", port);
});

//URL Mapping
app.get("/", function (req, res) {
  res.sendFile(`${__dirname}/index.html`);
});

app.get("/chatlist", (req, res) => {
  db.getChatLog(req.query.roomNum).then((r) => {
    res.send(r);
  });
});

//Socket.IO
io.on("connection", function (ioSocket) {
  // console.log("conn socketId:", ioSocket.id);

  ioSocket.on("disconnect", function () {
    clearInterval(ioSocket.interval);
  });

  ioSocket.on("error", function (error) {
    console.log(error);
  });

  /*-----------------------------------*/

  ioSocket.on("getRoomList_solo", (obj) => {
    console.log(obj);
    db.getRoomList().then((r) => {
      io.to(obj.socketId).emit("roomList", r);
    });
  });
  ioSocket.on("getRoomList", (obj) => {
    console.log(obj);
    db.getRoomList().then((r) => {
      io.emit("roomList", r);
    });
  });

  /*-----------------------------------*/

  ioSocket.on("leaveRoom", (roomNum, userName) => {
    ioSocket.leave(roomNum);
    io.to(roomNum).emit("msgToRoom_leaveRoom", userName);
  });
  ioSocket.on("joinRoom", (roomNum, userName) => {
    ioSocket.join(roomNum);
    io.to(roomNum).emit("msgToRoom_joinRoom", userName);
  });

  /*-----------------------------------*/

  ioSocket.on("joinGame", (roomNum, userName) => {
    ioSocket.join(roomNum + "_game");
    io.to(roomNum).emit("msgToRoom_joinGame", userName);
  });
  ioSocket.on("leaveGame", (roomNum, userName) => {
    ioSocket.join(roomNum + "_game");
    io.to(roomNum).emit("msgToRoom_leaveGame", userName);
  });
  ioSocket.on("ArrowLeft", (roomNum, playerNum) => {
    io.to(roomNum).emit("moveLeft", playerNum);
  });
  ioSocket.on("ArrowRight", (roomNum, playerNum) => {
    io.to(roomNum).emit("moveRight", playerNum);
  });
  ioSocket.on("SpaceBar", (roomNum, playerNum) => {
    io.to(roomNum).emit("readyPlayer", playerNum);
  });
  ioSocket.on("keyUp", (roomNum, playerNum) => {
    io.to(roomNum).emit("stopMoving", playerNum);
  });

  /*-----------------------------------*/

  ioSocket.on("msgToServer", (roomNum, userName, msg, dateTime) => {
    io.to(roomNum).emit("msgToRoom", { userName, msg, dateTime });
    db.recordMessage(msg, userName, roomNum, dateTime);
  });

  /*-----------------------------------*/

  ioSocket.on("createRoom", function (obj) {
    db.createRoom(obj.roomName, obj.userName);
    io.emit("roomCreated", obj);
  });
});
