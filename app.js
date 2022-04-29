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

let games = [];

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
    let gameNum = roomNum + "_game";

    let gameObj = games.find((game) => game.gameNum === gameNum);
    if (gameObj !== undefined) {
      gameObj.playerCnt++;
      if (gameObj.playerCnt > 2) return false;
      ioSocket.join(gameNum);
      io.to(ioSocket.id).emit("msgToRoom_joinGame", userName, "right");
    } else {
      games.push({
        gameNum: gameNum,
        playerCnt: 1,
      });
      ioSocket.join(gameNum);
      io.to(ioSocket.id).emit("msgToRoom_joinGame", userName, "left");
    }

    console.log(games);
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

  ioSocket.on("SpaceBar", (roomNum) => {
    io.to(roomNum).emit("startGame", Math.random() * 5 + 3);
  });

  ioSocket.on("keyUp", (roomNum, playerNum) => {
    io.to(roomNum).emit("stopMoving", playerNum);
  });

  ioSocket.on("die", (gameNum) => {
    // io.to(roomNum).emit("stopMoving", playerNum);
    /*
    *
    *
    *
    *
    *
    *
    *
    *
    *
    *
    *
    *
    *
    *
    *
    * splice 왜안되냐 이거 고치기
    *
    *
    *
    *
    *
    *
    *
    *
    *
    *
    *
    *
    *
     */
    games.splice(
      games.findIndex((game) => game.gameNum === gameNum),
      games.findIndex((game) => game.gameNum === gameNum)-1
    );

    console.log(games);
    
    io.to(gameNum).emit("gameOver");
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


    ioSocket.on("quit", function (obj) {
      /*

      (비정상종료 등 경우)
      모든 소켓 연결 해제시키기
      *
      *
      *
      *
      *
      *
      *
      *
      *
      *
      *
      *
      *
      *
      *
      *
      *
      *
      *
      *
      *
      *
      *
      *
      *
      *
      */
      
    });


});
