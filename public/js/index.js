let lastSender = null;
class Chatter {
  constructor() {
    this.curRoom = null;
    this.userName = null;
  }

  drawRooms(rooms) {
    $("#roomsul").empty();
    for (let room of rooms) {
      $("#roomsul").append(
        `<li class="roomli list-group-item" data-num="${room.room_idx}" data-roomname="${room.room_name}">
                        <div class="row">
                            <div class="col-2 li-left">
                                <img src="./public/img/dummy.png" class="img-fluid rounded-circle peusa">
                            </div>
                            <div class="col-8" li-mid>
                                <div class="li-roomname">${room.room_name}</div>
                                <div class="li-lastmsg">last_msg</div>
                            </div>
                            <div class="col-2 li-right">
                                <div class="li-datetime">hh24:mi</div>
                                <span class="li-badge badge bg-primary rounded-pill">11</span>
                            </div>
                        </div>
                    </li>`
      );
    }
  }

  joinRoom(e) {
    if (this.curRoom) {
      this.leaveRoom();
    }

    let roomNum = e.target.closest(".roomli").getAttribute("data-num");
    this.curRoom = roomNum;
    document.getElementById("roomtitle").innerHTML = e.target
      .closest(".roomli")
      .getAttribute("data-roomname");

    socket.emit("joinRoom", this.curRoom, userName.value);

    this.getChatLog(roomNum);
  }

  getChatLog(roomNum) {
    fetch(`/chatlist?roomNum=${roomNum}`)
      .then((r) => r.json())
      .then((r) => this.drawChat(r));
  }

  drawChat(r) {
    $("#chats").empty();
    for (let msg of r) {
      this.drawMessage(msg.message, msg.sender, msg.sent_datetime);
    }
  }

  drawMessage(msg, userName, dateTime) {
    let myMsg = `
                <div class="msgdiv" style="text-align: right;">
                    <span>${dateTime}</span>
                    <span class="alert-warning rounded msg">${msg}</span>
                </div>`;

    let othersInitialMsg = `
                    <div class="msgdiv" style="text-align: left;">
                        <div>${userName}</div>
                        <div>
                            <img src="./public/img/dummy.png" class="img-fluid rounded-circle chat-peusa"></div>
                        &emsp;&emsp;&emsp;<span class="alert-light rounded msg">${msg}</span>
                        <span>${dateTime}</span>
                    </div>`;

    let othersContinuousMsg = `
                    <div class="msgdiv" style="text-align: left;">
                        <div>
                        &emsp;&emsp;&emsp;<span class="alert-light rounded msg">${msg}</span>
                        <span>${dateTime}</span>
                    </div>`;

    if (userName === chatter.userName) {
      $("#chats").prepend(myMsg);
    } else {
      if (!document.getElementById("chats").childNodes[1]) {
        $("#chats").prepend(othersInitialMsg);
      } else {
        if (lastSender === userName) {
          $("#chats").prepend(othersContinuousMsg);
        } else {
          $("#chats").prepend(othersInitialMsg);
        }
      }
    }
    lastSender = userName;
  }

  leaveRoom() {
    socket.emit("leaveRoom", this.curRoom, this.userName);
    this.curRoom = null;
  }

  setUserName(e) {
    let nameInput = document.getElementById("userName");
    if (!nameInput.value) {
      Swal.fire({
        title: "알림",
        text: "유효하지않음!",
        icon: "warning",
        confirmButtonText: "ㅇㅋ",
      });
      return false;
    }
    e.target.disabled = true;
    nameInput.readOnly = true;
    this.userName = nameInput.value;
    e.target.innerHTML = `your userName: ${this.userName}`;

    socket.emit("getRoomList_solo", {
      socketId: socket.id,
      userName: this.userName,
    });
    //
    this.toggleDisplay("display-roomlist");
    document.getElementById("send").disabled = false;
  }

  createRoom() {
    let roomName = null;
    Swal.fire({
      title: "방 제목?",
      input: "text",
      inputAttributes: {
        autocapitalize: "off",
      },
      showCancelButton: true,
      confirmButtonText: "생성",
      cancelButtonText: "취소",
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
    }).then((result) => {
      if (result.isConfirmed) {
        if (!result.value) {
          Swal.fire({
            title: "Warning",
            text: "invalid value!",
            icon: "warning",
            confirmButtonText: "ㅇㅋ",
          });
          return false;
        }
        roomName = result.value;
        socket.emit("createRoom", {
          roomName: roomName,
          userName: this.userName,
        });
      }
    });
  }

  toggleDisplay(cmd) {
    let displays = document.getElementsByClassName("dp");
    let hdTitle = document.getElementById("headertitle");
    for (let dp of displays) {
      dp.style.display = "none";
    }
    document.getElementById(cmd).style.display = "block";

    switch (cmd) {
      case "display-userlist":
        hdTitle.innerHTML = "친구";
        break;
      case "display-roomlist":
        hdTitle.innerHTML = "채팅";
        break;
      case "display-settings":
        hdTitle.innerHTML = "더보기";
        break;
    }

    if (cmd === "display-chat") {
      this.toggleHeaderAndFooter(false);
    } else {
      this.toggleHeaderAndFooter(true);
    }
  }

  toggleHeaderAndFooter(bool) {
    if (bool) {
      document.getElementById("display-header").style.display = "flex";
      document.getElementById("display-footer").style.display = "block";
    } else {
      document.getElementById("display-header").style.display = "none";
      document.getElementById("display-footer").style.display = "none";
    }
  }
}
const chatter = new Chatter();
const socket = io();
socket.on("msgToRoom", (d) => {
  chatter.drawMessage(d.msg, d.userName, d.dateTime);
});

socket.on("roomList", (rooms) => {
  chatter.drawRooms(rooms);
});
socket.on("msgToRoom_leaveRoom", (d) => {
  console.log(`${d} has left the room`);
});
socket.on("msgToRoom_joinRoom", (d) => {
  console.log(`${d} has joined the room`);
});
socket.on("roomCreated", function (obj) {
  socket.emit("getRoomList", { socketId: socket.id, userName: this.userName });
});

let chat = document.getElementById("chat");
chat.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return false;
  document.getElementById("send").click();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "\\") {
    socket.emit('asdf','asdf');
  }
});

const getDateTimeString = function () {
  let dt = new Date();
  function treatUnderTen(a) {
    return a < 10 ? "0" + a : a;
  }
  let year = dt.getYear() + 1900;
  let month = treatUnderTen(dt.getMonth() + 1);
  let date = treatUnderTen(dt.getDate());
  let hour = treatUnderTen(dt.getHours());
  let min = treatUnderTen(dt.getMinutes());
  let sec = treatUnderTen(dt.getSeconds());
  return `${year}-${month}-${date} ${hour}:${min}:${sec}`;
};

document.addEventListener("click", (e) => {
  if (e.target.tagName === "DIV") {
    // if (e.target.className.includes('roomli')) {
    if (e.target.closest(".roomli")) {
      chatter.joinRoom(e);
      chatter.toggleDisplay("display-chat");
    }

    if (e.target.className.includes("confirmusername")) {
      chatter.setUserName(e);
    }

    if (e.target.id === "send") {
      if (!chat.value) return false;
      socket.emit(
        "msgToServer",
        chatter.curRoom,
        chatter.userName,
        chat.value,
        getDateTimeString()
      );
      chat.value = "";
    }
  }
  if (e.target.tagName === "I") {
    if (e.target.id === "backarrow") {
      chatter.toggleDisplay("display-roomlist");
      chatter.toggleHeaderAndFooter(true);
    }

    if (e.target.className.includes("createroom")) {
      chatter.createRoom(e);
    }
  }

  if (e.target.className.includes("menu-")) {
    let user = document.getElementById("i-userlist");
    let chat = document.getElementById("i-chatlist");
    let sett = document.getElementById("i-settings");

    if (e.target.className.includes("menu-userlist")) {
      chat.classList.remove("bi-chat-dots-fill");
      chat.classList.add("bi-chat-dots");
      sett.classList.remove("bi-three-dots-vertical");
      sett.classList.add("bi-three-dots");

      user.classList.remove("bi-people");
      user.classList.add("bi-people-fill");

      chatter.toggleDisplay("display-userlist");
    }
    if (e.target.className.includes("menu-chatlist")) {
      user.classList.remove("bi-people-fill");
      user.classList.add("bi-people");
      sett.classList.remove("bi-three-dots-vertical");
      sett.classList.add("bi-three-dots");

      chat.classList.remove("bi-chat-dots");
      chat.classList.add("bi-chat-dots-fill");

      chatter.toggleDisplay("display-roomlist");
    }
    if (e.target.className.includes("menu-settings")) {
      user.classList.remove("bi-people-fill");
      user.classList.add("bi-people");
      chat.classList.remove("bi-chat-dots-fill");
      chat.classList.add("bi-chat-dots");

      sett.classList.remove("bi-three-dots");
      sett.classList.add("bi-three-dots-vertical");

      chatter.toggleDisplay("display-settings");
    }
  }
});
