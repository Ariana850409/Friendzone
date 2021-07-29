const socket = io();
socket.on("connect", function () {
    console.log('success')
});

let myMapPic;
async function getData() {
    await verify();
    // 抓到個人資料
    let email = localStorage.getItem("user")
    await fetch('/getMember', {
        method: 'POST',
        body: JSON.stringify({ email: email }),
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
                let mypic = result.data[0].pic;
                if (mypic == 'undefined') {
                    document.querySelector('.myself-pic').src = "../icon/user.png";
                    myMapPic = "../icon/user.png";
                } else {
                    document.querySelector('.myself-pic').src = mypic;
                    myMapPic = mypic;
                }
                document.querySelector('.myself-name').textContent = result.data[0].username;
                if (location.pathname === '/map') {
                    canLocate();
                }
            }
        })
    // 抓取通知欄訊息
    fetch('/getInform', {
        method: 'POST',
        body: JSON.stringify({ email: email }),
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })
        .then(res => {
            return res.json();
        }).then(result => {
            let informList = document.getElementById("inform-list");
            if (result.error) {
                console.log(result.message);
            } else if (result.ok && result.data.length === 0) {
                document.querySelector(".noinform-msg").style.display = "block";
            } else if (result.ok && result.data.length !== 0) {
                for (let i = 0; i < result.data.length; i++) {
                    let informDiv = document.createElement("div");
                    informDiv.className = "informs";
                    informDiv.setAttribute('data-id', result.data[i].friendEmail);
                    if (result.data[i].roomID !== null) {
                        informDiv.setAttribute('data-room', result.data[i].roomID);
                        informDiv.setAttribute('onclick', "messageFriend(this)");
                        informDiv.style.cursor = "pointer";
                    }
                    informList.appendChild(informDiv);
                    let informImg = document.createElement("img");
                    informImg.className = "inform-pic";
                    if (result.data[i].friendPic === 'undefined') {
                        informImg.src = '../icon/user.png';
                    } else {
                        informImg.src = result.data[i].friendPic;
                    }
                    informDiv.appendChild(informImg);
                    let informMsg = document.createElement("span");
                    informMsg.className = "inform-msg";
                    let content = result.data[i].content;
                    if (content === 1) {
                        informMsg.textContent = result.data[i].friendName + " 向你發送了好友邀請。";
                        informDiv.appendChild(informMsg);
                        let acceptImg = document.createElement("img");
                        acceptImg.className = "inform-request-btn";
                        acceptImg.src = '../icon/accept.png';
                        acceptImg.setAttribute('data-id', result.data[i].friendEmail);
                        acceptImg.setAttribute('onclick', "friendReponse(this,'accept')")
                        informMsg.appendChild(acceptImg);
                        let rejectImg = document.createElement("img");
                        rejectImg.className = "inform-request-btn";
                        rejectImg.src = '../icon/reject.png';
                        rejectImg.setAttribute('data-id', result.data[i].friendEmail);
                        rejectImg.setAttribute('onclick', "friendReponse(this,'reject')")
                        informMsg.appendChild(rejectImg);
                    } else if (content === 2) {
                        informMsg.textContent = result.data[i].friendName + " 向你發送了新訊息。";
                        informDiv.appendChild(informMsg);
                    }
                }
            }
        })

    // 抓到好友資料
    fetch('/getFriendData', {
        method: 'POST',
        body: JSON.stringify({ email: email }),
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })
        .then(res => {
            return res.json();
        }).then(result => {
            let friendList = document.getElementById("friend-list");
            if (result.error) {
                console.log(result.message);
            } else if (result.ok && result.data.length === 0) {
                document.querySelector(".nofriend-msg").style.display = "block";
            } else if (result.ok && result.data.length !== 0) {
                for (let i = 0; i < result.data.length; i++) {
                    let friendDiv = document.createElement("div");
                    friendDiv.className = "friends";
                    friendDiv.setAttribute('data-id', result.data[i].email);
                    friendList.appendChild(friendDiv);
                    let friendImg = document.createElement("img");
                    friendImg.className = "friend-pic";
                    if (result.data[i].pic === 'undefined') {
                        friendImg.src = '../icon/user.png';
                    } else {
                        friendImg.src = result.data[i].pic;
                    }
                    friendDiv.appendChild(friendImg);
                    let friendName = document.createElement("span");
                    friendName.className = "friend-name";
                    friendName.textContent = result.data[i].username;
                    friendDiv.appendChild(friendName);
                    let messageImg = document.createElement("img");
                    messageImg.className = "message-img";
                    messageImg.src = '../icon/message.png';
                    messageImg.setAttribute('data-room', result.data[i].roomID);
                    messageImg.setAttribute('onclick', "messageFriend(this)")
                    friendDiv.appendChild(messageImg);
                    let callImg = document.createElement("img");
                    callImg.className = "call-img";
                    callImg.src = '../icon/call.png';
                    callImg.setAttribute('data-room', result.data[i].roomID);
                    callImg.setAttribute('onclick', "callFriend(this)")
                    friendDiv.appendChild(callImg);
                }
                if (location.pathname === '/map') {
                    putFriendOnMap(result);
                }
            }
        })
    // 加入所有的room
    socket.emit("joinRoom", email);
}

// 驗證是否為登入狀態
async function verify() {
    let localToken = localStorage.getItem("token")
    await fetch('/verify', {
        method: 'PATCH',
        headers: { 'Authorization': `BEARER ${localToken}` }
    })
        .then(res => {
            return res.json();
        }).then(result => {
            if (result.error) {
                window.location.href = "/";
            } else if (result.ok) {
                localStorage.setItem("user", result.data.user.email);
            }
        })

}

// 預覽頭貼
function handleFiles(pic) {
    let previewPic = document.querySelector(".previewPic");
    let file = pic[0];
    let reader = new FileReader();
    reader.onload = (function (aImg) { return function (e) { aImg.src = e.target.result; }; })(previewPic);
    reader.readAsDataURL(file);
}

let errorMsg = document.querySelector('.error-msg');
let successMsg = document.querySelector('.success-msg');

// 切換登入/註冊div
function changeState(state) {
    if (state == "login") {
        document.getElementById('registerForm').style.display = "none";
        document.getElementById('loginForm').style.display = "block";
        errorMsg.style.display = "none";
        successMsg.style.display = "none";
        document.getElementById('loginInputEmail').value = "";
        document.getElementById('loginInputPassword').value = "";

    } else if (state == "register") {
        document.getElementById('registerForm').style.display = "block";
        document.getElementById('loginForm').style.display = "none";
        errorMsg.style.display = "none";
        successMsg.style.display = "none";
        document.getElementById('registerInputName').value = "";
        document.getElementById('registerInputEmail').value = "";
        document.getElementById('registerInputPassword').value = "";
        document.querySelector('.previewPic').src = "../icon/user.png";
    }
}

// 登入
function login() {
    event.preventDefault();
    let email = document.getElementById('loginInputEmail').value;
    let password = document.getElementById('loginInputPassword').value;
    if (email.indexOf(" ") != -1 || password.indexOf(" ") != -1) {
        errorMsg.textContent = "請勿輸入空白符號";
        errorMsg.style.display = "block";
    } else if (email == "" || password == "") {
        errorMsg.textContent = "請輸入姓名或電子郵件或密碼";
        errorMsg.style.display = "block";
    } else if (email.indexOf("@") == -1) {
        errorMsg.textContent = "請輸入正確的電子郵件格式";
        errorMsg.style.display = "block";
    }
    else {
        errorMsg.style.display = "none";
        let data = { email: email, password: password };
        fetch('/login', {
            method: 'PATCH',
            body: JSON.stringify(data),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        })
            .then(res => {
                return res.json();
            }).then(result => {
                if (result.error && result.message == "電子郵件或密碼輸入錯誤") {
                    errorMsg.textContent = result.message;
                    errorMsg.style.display = "block";
                } else if (result.error && result.message == "伺服器內部錯誤") {
                    errorMsg.textContent = result.message;
                    errorMsg.style.display = "block";
                } else if (result.ok) {
                    errorMsg.style.display = "none";
                    localStorage.setItem("token", result.token);
                    window.location.href = "/map";
                }
            })
    }
}

// 註冊
function register() {
    event.preventDefault();
    let pic = document.getElementById('uploadPicInput').files[0];
    let name = document.getElementById('registerInputName').value;
    let email = document.getElementById('registerInputEmail').value;
    let password = document.getElementById('registerInputPassword').value;
    if (name.indexOf(" ") != -1 || email.indexOf(" ") != -1 || password.indexOf(" ") != -1) {
        errorMsg.textContent = "請勿輸入空白符號";
        errorMsg.style.display = "block";
        successMsg.style.display = "none";
    } else if (name == "" || email == "" || password == "") {
        errorMsg.textContent = "請輸入姓名或電子郵件或密碼";
        errorMsg.style.display = "block";
        successMsg.style.display = "none";
    } else if (email.indexOf("@") == -1) {
        errorMsg.textContent = "請輸入正確的電子郵件格式";
        errorMsg.style.display = "block";
        successMsg.style.display = "none";
    }
    else {
        let formData = new FormData();
        formData.append("pic", pic);
        formData.append("name", name);
        formData.append("email", email);
        formData.append("password", password);
        fetch('/register', {
            method: 'POST',
            body: formData,
        })
            .then(res => {
                return res.json();
            }).then(result => {
                if (result.error && result.message == "此電子郵件已被註冊過") {
                    errorMsg.textContent = result.message;
                    errorMsg.style.display = "block";
                    successMsg.style.display = "none";
                } else if (result.error && result.message == "伺服器內部錯誤") {
                    errorMsg.textContent = result.message;
                    errorMsg.style.display = "block";
                    successMsg.style.display = "none";
                } else if (result.ok) {
                    errorMsg.style.display = "none";
                    successMsg.style.display = "block";
                }
            })
    }
}

// 登出
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
}

// 新增好友視窗
function addFriend(status) {
    if (status == "open") {
        document.querySelector('.request-error-msg').style.display = "none";
        document.querySelector('.request-success-msg').style.display = "none";
        document.getElementById('friend-request-input').value = "";
        document.querySelector('.shadow').style.display = "block";
        document.getElementById('addFriendWindow').style.display = "block";
    } else if (status == "close") {
        document.querySelector('.shadow').style.display = "none";
        document.getElementById('addFriendWindow').style.display = "none";
        document.querySelector('.end-call-hint').style.display = "none";
    }
}

// 發送好友邀請
function sendFriendRequest() {
    let friendEmail = document.getElementById('friend-request-input').value;
    let errorMsg = document.querySelector('.request-error-msg');
    let successMsg = document.querySelector('.request-success-msg');
    if (friendEmail.indexOf(" ") != -1) {
        errorMsg.textContent = "請勿輸入空白符號";
        errorMsg.style.display = "block";
        successMsg.style.display = "none";
    } else if (friendEmail == "") {
        errorMsg.textContent = "請輸入好友帳號";
        errorMsg.style.display = "block";
        successMsg.style.display = "none";
    } else if (friendEmail.indexOf("@") == -1) {
        errorMsg.textContent = "請輸入正確的電子郵件格式";
        errorMsg.style.display = "block";
        successMsg.style.display = "none";
    }
    else {
        errorMsg.style.display = "none";
        let myEmail = localStorage.getItem("user")
        let data = { user: myEmail, friend: friendEmail };
        fetch('/addFriend', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        })
            .then(res => {
                return res.json();
            }).then(result => {
                if (result.error) {
                    errorMsg.textContent = result.message;
                    errorMsg.style.display = "block";
                    successMsg.style.display = "none";
                } else if (result.ok) {
                    errorMsg.style.display = "none";
                    successMsg.style.display = "block";
                    socket.emit("sendFriendRequest", myEmail, friendEmail);
                }
            })
    }
}

// 好友名單開合
$(document).ready(function () {
    $('#friendCollapse').on('click', function () {
        $('#friend-list').toggleClass('active');
    });
});

// 通知欄開合
$(document).ready(function () {
    $('#informCollapse').on('click', function () {
        $('#inform-list').toggleClass('active');
    });
});

// 接受or拒絕別人的好友邀請
function friendReponse(myObj, status) {
    let myID = localStorage.getItem("user");
    let friendID = myObj.dataset.id;
    let informDiv = document.querySelector(`[data-id='${friendID}']`);
    informDiv.remove();
    if (status === "accept") {
        fetch('/acceptRequest', {
            method: 'POST',
            body: JSON.stringify({ myID: myID, friendID: friendID }),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        })
            .then(res => {
                return res.json();
            }).then(result => {
                if (result.error) {
                    alert(result.message);
                } else if (result.ok) {
                    if (document.querySelector(".nofriend-msg").style.display === "block") {
                        document.querySelector(".nofriend-msg").style.display = "none";
                    }
                    let friendList = document.getElementById("friend-list");
                    let friendDiv = document.createElement("div");
                    friendDiv.className = "friends";
                    friendDiv.setAttribute('data-id', friendID);
                    friendList.appendChild(friendDiv);
                    let friendImg = document.createElement("img");
                    friendImg.className = "friend-pic";
                    if (result.data[0].pic === 'undefined') {
                        friendImg.src = '../icon/user.png';
                    } else {
                        friendImg.src = result.data[0].pic;
                    }
                    friendDiv.appendChild(friendImg);
                    let friendName = document.createElement("span");
                    friendName.className = "friend-name";
                    friendName.textContent = result.data[0].username;
                    friendDiv.appendChild(friendName);
                    let messageImg = document.createElement("img");
                    messageImg.className = "message-img";
                    messageImg.src = '../icon/message.png';
                    messageImg.setAttribute('data-id', friendID);
                    messageImg.setAttribute('data-room', result.room);
                    messageImg.setAttribute('onclick', "messageFriend(this)")
                    friendDiv.appendChild(messageImg);
                    socket.emit("joinNewRoom", result.room, 0);
                    socket.emit("friendJoinNewRoom", friendID, result.room);
                }
            })

    } else if (status === "reject") {
        fetch('/rejectRequest', {
            method: 'DELETE',
            body: JSON.stringify({ myID: myID, friendID: friendID }),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        })
            .then(res => {
                return res.json();
            }).then(result => {
                if (result.error) {
                    alert(result.message);
                } else if (result.ok) {
                }
            })
    }
}

// 進入指定聊天室
function messageFriend(myObj) {
    let roomID = myObj.dataset.room;
    window.location.href = "/chat/" + roomID;
}

// 進入聊天室頁面
function goChatroom() {
    let email = localStorage.getItem("user")
    fetch('/getChatList', {
        method: 'POST',
        body: JSON.stringify({ email: email }),
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })
        .then(res => {
            return res.json();
        }).then(result => {
            if (result.error) {
                console.log(result.message);
            } else if (result.ok && result.data.length === 0) {
                window.location.href = "/chat/new";
            } else if (result.ok && result.data.length !== 0) {
                window.location.href = "/chat/" + result.data[0].roomID;
            }
        })
}

let localStream;
let myVideo = document.getElementById('myVideo');
let remoteVideo = document.getElementById('remoteVideo');
let callRoomID;
// 取得自己的視訊畫面
async function createMedia() {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    myVideo.srcObject = localStream;
}

let pc;
// 建立 P2P 連接
function createPeerConnection() {
    const configuration = {
        iceServers: [{
            urls: 'stun:stun.l.google.com:19302' // Google's public STUN server
        }]
    };
    pc = new RTCPeerConnection(configuration);
    console.log(pc)
};

// 增加本地流
function addLocalStream() {
    pc.addStream(localStream)
};

// 監聽 ICE Server
function onIceCandidates() {
    // 找尋到 ICE 候選位置後，送去 Server 與另一位配對
    pc.onicecandidate = ({ candidate }) => {
        if (!candidate) { return; }
        // console.log('onIceCandidate => ', candidate);
        socket.emit("peerConnectSignaling", { candidate }, callRoomID);
    };
};

// 監聽 ICE 連接狀態
function onIceConnectionStateChange() {
    pc.oniceconnectionstatechange = (evt) => {
        console.log('ICE 伺服器狀態變更 => ', evt.target.iceConnectionState);
    };
}

// 監聽是否有流傳入，如果有的話就顯示影像
function onAddStream() {
    pc.onaddstream = (event) => {
        if (!remoteVideo.srcObject && event.stream) {
            remoteVideo.srcObject = event.stream;
            console.log('接收流並顯示於遠端視訊！', event);
        }
    }
}

let offer;
const signalOption = {
    offerToReceiveAudio: 1, // 是否傳送聲音流給對方
    offerToReceiveVideo: 1, // 是否傳送影像流給對方
};

async function createSignal(isOffer) {
    try {
        if (!pc) {
            console.log('尚未開啟視訊');
            return;
        }
        // 呼叫 peerConnect 內的 createOffer / createAnswer
        offer = await pc[`create${isOffer ? 'Offer' : 'Answer'}`](signalOption);
        // 設定本地流配置
        await pc.setLocalDescription(offer);
        sendSignalingMessage(pc.localDescription, isOffer ? true : false)
    } catch (err) {
        console.log(err);
    }
};

function sendSignalingMessage(desc, offer) {
    const isOffer = offer ? "offer" : "answer";
    console.log(`寄出 ${isOffer}`);
    socket.emit("peerConnectSignaling", { desc }, callRoomID);
};


// 打視訊通話給朋友
async function callFriend(myObj) {
    let myEmail = localStorage.getItem("user")
    let roomID = myObj.dataset.room;
    callRoomID = roomID;
    document.querySelector('.shadow').style.display = "block";
    document.querySelector('.call-div').style.display = "block";
    await createMedia();
    socket.emit("callFriend", myEmail, roomID);
}

// 接聽or掛斷通話
async function responseCall(myObj, state) {
    let roomID = myObj.dataset.room;
    callRoomID = roomID;
    if (state === "pickup") {
        socket.emit("answerCall", roomID, 'pickup');
        document.querySelector('.incoming-call-div').style.display = "none";
        document.querySelector('.shadow').style.display = "block";
        document.querySelector('.call-div').style.display = "block";
        await createMedia();
        await createPeerConnection();
        addLocalStream();
        onIceCandidates();
        onIceConnectionStateChange();
        onAddStream();
    } else if (state === "hangup") {
        socket.emit("answerCall", roomID, 'hangup');
        document.querySelector('.shadow').style.display = "none";
        document.querySelector('.incoming-call-div').style.display = "none";
    }
}

// 關掉本地取得串流畫面
function stopMedia() {
    const stream = myVideo.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(function (track) {
        track.stop();
    });
    myVideo.srcObject = null;
}

// 結束通話
function endCall() {
    document.querySelector('.shadow').style.display = "none";
    document.querySelector('.call-div').style.display = "none";
    if (pc) {
        stopMedia();
        remoteVideo.srcObject = null;
        pc.close();
        pc = null;
    }
    socket.emit('endCall', callRoomID);
}

// 控制視訊關聲音or畫面
let isAudio = true;
let isVideo = true;
function muteCall(choice) {
    if (choice === 'audio') {
        console.log(isAudio);
        console.log(localStream.getAudioTracks()[0]);
        isAudio = !isAudio;
        localStream.getAudioTracks()[0].enabled = isAudio;
    } else if (choice === 'video') {
        isVideo = !isVideo;
        localStream.getVideoTracks()[0].enabled = isVideo;
    }
}

// 別人發送好友邀請的即時通知
socket.on("receiveFriendRequest", (result) => {
    document.querySelector(".noinform-msg").style.display = "none";
    let informList = document.getElementById("inform-list");
    let informDiv = document.createElement("div");
    informDiv.className = "informs";
    informDiv.setAttribute('data-id', result[0].friendEmail);
    informList.appendChild(informDiv);
    let informImg = document.createElement("img");
    informImg.className = "inform-pic";
    if (result[0].friendPic === 'undefined') {
        informImg.src = '../icon/user.png';
    } else {
        informImg.src = result[0].friendPic;
    }
    informDiv.appendChild(informImg);
    let informMsg = document.createElement("span");
    informMsg.className = "inform-msg";
    let content = result[0].content;
    if (content === 1) {
        informMsg.textContent = result[0].friendName + " 向你發送了好友邀請。";
    }
    informDiv.appendChild(informMsg);
    let acceptImg = document.createElement("img");
    acceptImg.className = "inform-request-btn";
    acceptImg.src = '../icon/accept.png';
    acceptImg.setAttribute('data-id', result[0].friendEmail);
    acceptImg.setAttribute('onclick', "friendReponse(this,'accept')")
    informMsg.appendChild(acceptImg);
    let rejectImg = document.createElement("img");
    rejectImg.className = "inform-request-btn";
    rejectImg.src = '../icon/reject.png';
    rejectImg.setAttribute('data-id', result[0].friendEmail);
    rejectImg.setAttribute('onclick', "friendReponse(this,'reject')")
    informMsg.appendChild(rejectImg);
})

// 別人發送新訊息的即時通知
socket.on("receiveMessageInform", (result) => {
    console.log(result)
    document.querySelector(".noinform-msg").style.display = "none";
    let informList = document.getElementById("inform-list");
    let informDiv = document.createElement("div");
    informDiv.className = "informs";
    informDiv.setAttribute('data-id', result[0].friendEmail);
    informDiv.setAttribute('data-room', result[0].roomID);
    informDiv.setAttribute('onclick', "messageFriend(this)");
    informDiv.style.cursor = "pointer";
    informList.appendChild(informDiv);
    let informImg = document.createElement("img");
    informImg.className = "inform-pic";
    if (result[0].friendPic === 'undefined') {
        informImg.src = '../icon/user.png';
    } else {
        informImg.src = result[0].friendPic;
    }
    informDiv.appendChild(informImg);
    let informMsg = document.createElement("span");
    informMsg.className = "inform-msg";
    let content = result[0].content;
    if (content === 2) {
        informMsg.textContent = result[0].friendName + " 向你發送了新訊息。";
    }
    informDiv.appendChild(informMsg);
})

// 別人接受好友邀請後新增加的room
socket.on("askJoinRoom", (roomID) => {
    socket.emit("joinNewRoom", roomID, 1);
})
// 系統發送互為好友告示
socket.on("becomeFriend", (msg) => {
    console.log(msg);
})

// 收到別人來電通知
socket.on("receiveCall", (result, roomID) => {
    let incomingPic = "../icon/user.png";
    if (result[0].pic !== "undefined") {
        incomingPic = result[0].pic;
    }
    document.querySelector('.incoming-friend-pic').src = incomingPic;
    document.querySelector('.incoming-friend-name').textContent = `${result[0].username} 撥打視訊通話給你`;
    let bothimg = document.querySelectorAll('.incoming-call-img');
    bothimg[0].setAttribute('data-room', roomID);
    bothimg[1].setAttribute('data-room', roomID);
    document.querySelector('.shadow').style.display = "block";
    document.querySelector('.incoming-call-div').style.display = "block";

})

// 收到對方回覆去電結果的通知
socket.on("answerCall", (roomID, response) => {
    if (response === "hangup") {
        endCall();
        document.getElementById('end-call-msg').textContent = "對方已拒絕通話";
        document.querySelector('.end-call-hint').style.display = "block";
    } else if (response === "pickup") {
        createPeerConnection();
        addLocalStream();
        onIceCandidates();
        onIceConnectionStateChange();
        onAddStream();
        createSignal(true);
    }
})

//接收peerConnect訊號  desc->Offer/Answer
socket.on('peerConnectSignaling', async ({ desc, candidate }) => {
    if (pc) {
        console.log(pc)
        if (desc && !pc.currentRemoteDescription) {
            console.log('desc => ', desc);
            // currentRemoteDescription 最近一次連線成功的相關訊息
            await pc.setRemoteDescription(new RTCSessionDescription(desc));
            createSignal(desc.type === 'answer' ? true : false);
        } else if (candidate) {
            // 新增對方 IP 候選位置
            console.log('candidate =>', candidate);
            pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }
});

socket.on("endCall", () => {
    document.querySelector('.shadow').style.display = "none";
    document.querySelector('.incoming-call-div').style.display = "none";
    if (pc) {
        document.querySelector('.shadow').style.display = "none";
        document.querySelector('.call-div').style.display = "none";
        stopMedia();
        remoteVideo.srcObject = null;
        pc.close();
        pc = null;
        document.getElementById('end-call-msg').textContent = "對方已結束通話";
        document.querySelector('.end-call-hint').style.display = "block";
    }
})

