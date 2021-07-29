let email = localStorage.getItem("user");
let roomID = location.pathname.split('/')[2];
let screen = document.querySelector(".chatzoom-screen");
async function getChatData() {
    await getData();
    // 抓到所有聊天欄位
    await fetch('/getChatList', {
        method: 'POST',
        body: JSON.stringify({ email: email }),
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })
        .then(res => {
            return res.json();
        }).then(result => {
            let messageList = document.getElementById("message-list");
            if (result.error) {
                console.log(result.message);
            } else if (result.ok && result.data.length === 0) {
                document.getElementById("nofriend-list").style.display = "block";
                document.querySelector(".send-wrap").style.display = "none";
            } else if (result.ok && result.data.length !== 0) {
                for (let i = 0; i < result.data.length; i++) {
                    let msgDiv = document.createElement("div");
                    msgDiv.className = "messages row";
                    msgDiv.setAttribute('data-room', result.data[i].roomID);
                    msgDiv.setAttribute('onclick', "messageFriend(this)")
                    messageList.appendChild(msgDiv);
                    let leftDiv = document.createElement("div");
                    leftDiv.className = "col-3 col-md-4 col-lg-3 p-2";
                    msgDiv.appendChild(leftDiv);
                    let picImg = document.createElement("img");
                    picImg.className = "message-pic";
                    if (result.data[i].pic === 'undefined') {
                        picImg.src = '../icon/user.png';
                    } else {
                        picImg.src = result.data[i].pic;
                    }
                    leftDiv.appendChild(picImg);
                    let rightDiv = document.createElement("div");
                    rightDiv.className = "col-9 col-md-7 offset-md-1 col-lg-9 offset-lg-0 pl-0 pr-2 py-2";
                    msgDiv.appendChild(rightDiv);
                    let nameDiv = document.createElement("div");
                    nameDiv.className = "d-flex justify-content-between";
                    rightDiv.appendChild(nameDiv);
                    let roomName = document.createElement("p");
                    roomName.className = "message-name";
                    roomName.textContent = result.data[i].username;
                    nameDiv.appendChild(roomName);
                    let roomTime = document.createElement("span");
                    roomTime.className = "message-time text-right";
                    let time = result.data[i].latestTime.substr(5, 11).replace('-', '/');
                    roomTime.textContent = time;
                    nameDiv.appendChild(roomTime);
                    let roomMag = document.createElement("p");
                    roomMag.className = "last-message";
                    roomMag.textContent = result.data[i].latestMessage;
                    rightDiv.appendChild(roomMag);
                }
                document.querySelector(`.messages[data-room='${roomID}']`).classList.add("pickup");
            }
        })
    // 抓出指定room的個人聊天內容
    await fetch('/getChatData', {
        method: 'POST',
        body: JSON.stringify({ email: email, roomID: roomID }),
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })
        .then(res => {
            return res.json();
        }).then(result => {
            if (result.error) {
                console.log(result.message);
            } else if (result.ok && result.data.length !== 0 && result.friend.length !== 0) {
                let pic = document.querySelector(".chatzoom-pic");
                if (result.friend[0].pic === 'undefined') {
                    pic.src = '../icon/user.png';
                } else {
                    pic.src = result.friend[0].pic;
                }
                document.querySelector(".chatzoom-name").textContent = result.friend[0].username;
                for (let i = 0; i < result.data.length; i++) {
                    let time = result.data[i].time.split(' ')[1].substr(0, 5);
                    if (result.data[i].sender === 'system') {
                        let systemMsg = document.createElement("div");
                        systemMsg.className = "system-message";
                        systemMsg.textContent = result.data[i].content;
                        screen.appendChild(systemMsg);
                    } else if (result.data[i].sender === email) {
                        let myMsg = document.createElement("div");
                        myMsg.className = "my-message";
                        myMsg.textContent = result.data[i].content;
                        screen.appendChild(myMsg);
                        let myTime = document.createElement("span");
                        myTime.className = "my-chattime";
                        myTime.textContent = time;
                        myMsg.appendChild(myTime);
                    } else {
                        let friendMsg = document.createElement("div");
                        friendMsg.className = "friend-message";
                        friendMsg.textContent = result.data[i].content;
                        screen.appendChild(friendMsg);
                        let friendTime = document.createElement("span");
                        friendTime.className = "friend-chattime";
                        friendTime.textContent = time;
                        friendMsg.appendChild(friendTime);
                    }
                    screen.scrollTop = screen.scrollHeight;
                }
            }
        })
}

// const socket = io();
// 當觸發連線建立事件
// 發送 greet 事件給伺服器
// socket.on("connect", function () {
//     console.log('success')
// });

// socket.on('reconnect', function () {
//     console.log('you have been reconnected');
//     // where username is a global variable for the client
//     socket.emit('user-reconnected', username);
// });

// socket.emit("send", (msg) => {
//     socket.emit("greet");
// });

// socket.on("msg", (msg) => {
//     document.getElementById('msg').textContent = msg;
// });


// 當收到伺服器回傳到 greet 事件
// 將內容轉到 div 中呈現
// socket.on("greet", function (msg) {
//     document.getElementById("msg").innerText = msg;
// });

let messageInput = document.querySelector(".chatzoom-input");
// 送出內容
function sendMessage() {
    let content = messageInput.value;
    if (content !== "" && content.replace(/ /g, "") !== "") {
        socket.emit("sendMessage", email, roomID, content);
        fetch('/sendMessage', {
            method: 'POST',
            body: JSON.stringify({ sender: email, roomID: roomID, content: content }),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        })
            .then(res => {
                return res.json();
            }).then(result => {
                if (result.error) {
                    console.log(result.message);
                } else if (result.ok) {
                    socket.emit("sendMessageInform", email, roomID);
                }
            })
    }
    messageInput.value = "";
}

// 按enter送出對話
messageInput.addEventListener("keydown", (e) => {
    if (e.keyCode === 13 && e.shiftKey === false) {
        e.preventDefault()
        sendMessage();
    }
})

// 接收聊天內容
socket.on("receiveMessage", (sender, room, content, timeNow) => {
    let parentDiv = document.getElementById("message-list");
    let listChange = document.querySelector(`.messages[data-room='${room}']`);
    let listChangeTime = document.querySelector(`.messages[data-room='${room}'] .message-time`);
    let listChangeMsg = document.querySelector(`.messages[data-room='${room}'] .last-message`);
    parentDiv.insertBefore(listChange, parentDiv.firstElementChild);
    let listTime = timeNow.substr(5, 11).replace('-', '/');
    listChangeTime.textContent = listTime;
    listChangeMsg.textContent = content;
    let time = timeNow.split(' ')[1].substr(0, 5);
    if (room === roomID && sender === email) {
        let myMsg = document.createElement("div");
        myMsg.className = "my-message";
        myMsg.textContent = content;
        screen.appendChild(myMsg);
        let myTime = document.createElement("span");
        myTime.className = "my-chattime";
        myTime.textContent = time;
        myMsg.appendChild(myTime);
    } else if (room === roomID && sender !== email) {
        let friendMsg = document.createElement("div");
        friendMsg.className = "friend-message";
        friendMsg.textContent = content;
        screen.appendChild(friendMsg);
        let friendTime = document.createElement("span");
        friendTime.className = "friend-chattime";
        friendTime.textContent = time;
        friendMsg.appendChild(friendTime);
    }
    screen.scrollTop = screen.scrollHeight;
});


function rwdAllroom() {
    document.querySelector(".chatroom").style.display = "none";
    document.getElementById("message-list").style.display = "block";
}