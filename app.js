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
    console.log(r);
    res.send(r);
  });
});

//Socket.IO
io.on("connection", function (ioSocket) {
  console.log("conn socketId:", ioSocket.id);

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
    io.to(roomNum).emit("msgToRoom_leaveRoom", userName);
    ioSocket.leave(roomNum);
  });

  ioSocket.on("joinRoom", (roomNum, userName) => {
    ioSocket.join(roomNum);
    io.to(roomNum).emit("msgToRoom_joinRoom", userName);
  });

  /*-----------------------------------*/

  ioSocket.on("msgToServer", (roomNum, userName, msg, dateTime) => {
    io.to(roomNum).emit("msgToRoom", { userName, msg, dateTime });
    db.recordMessage(msg, userName, roomNum, dateTime);
  });
  ioSocket.on("asdf", (asdf) => {
    console.log(asdf);
  });

  /*-----------------------------------*/

  ioSocket.on("createRoom", function (obj) {
    db.createRoom(obj.roomName, obj.userName);
    io.emit("roomCreated", obj);
  });
});
