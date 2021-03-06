let latlngNow;
let friendData;

let map = L.map('mapid', { attributionControl: false });
let mysite = map.locate({ setView: true, watch: true });
let osmUrl = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
let osm = new L.TileLayer(osmUrl, { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', minZoom: 8, maxZoom: 16 });
L.control.attribution({
    position: 'bottomleft'
}).addTo(map);
map.addLayer(osm);

// 進行定位
function onLocationFound(e) {
    latlngNow = e.latlng;
    let radius = e.accuracy;
    let markerIcon = L.icon({
        iconUrl: '../icon/marker.png',
        iconSize: [60, 60],
        iconAnchor: [28, 45],
        className: 'marker-icon'
    });
    L.marker(e.latlng, { icon: markerIcon }).addTo(map);
    let myIcon = L.icon({
        iconUrl: myMapPic,
        iconSize: [40, 40],
        iconAnchor: [18, 42],
        popupAnchor: [3, -45],
        className: 'map-icon my-map-icon'
    });
    L.marker(e.latlng, { icon: myIcon }).addTo(map).bindPopup("你與此點距離約" + radius + "公尺內").openPopup();
    map.stopLocate();
    sendLocation();
}

// 不允許定位or抓不到定位
function onLocationError(e) {
    map.setView(new L.LatLng(25.039005, 121.564692), 12);
    alert(e.message);
}

function canLocate() {
    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);
}

// 地圖回到現在位置
$('.locationNow').on('click', function () {
    map.panTo(latlngNow);
});

// 打開廣播訊息視窗
function openBroadcastWindow() {
    document.getElementById('broadcast-meter-input').value = "";
    document.querySelector('.broadcast-msg-input').value = "";
    document.querySelector('.broadcast-error-msg').style.display = "none";
    document.querySelector('.broadcast-success-msg').style.display = "none";
    document.querySelector('.shadow').style.display = "block";
    document.querySelector('.broadcast-window').style.display = "block";
}

let broadcastMsgInput = document.querySelector(".broadcast-msg-input");
let broadcastMeterInput = document.getElementById('broadcast-meter-input');
// 判斷廣播訊息要傳給哪些人
function broadcastFriend(meter) {
    let broadcastList = [];
    for (let i = 0; i < friendData.length; i++) {
        if (friendData[i].latlng !== null) {
            let latlng = eval('(' + friendData[i].latlng + ')');
            let distance = latlngNow.distanceTo(latlng) / 1000;
            if (distance <= meter) {
                broadcastList.push(friendData[i])
            }
        }
    }
    return broadcastList;
}

// 傳送廣播訊息
function broadcastMessage() {
    document.querySelector('.broadcast-success-msg').textContent = "訊息發送中...";
    document.querySelector('.broadcast-success-msg').style.display = "block";
    let content = broadcastMsgInput.value;
    let meter = broadcastMeterInput.value
    let sender = localStorage.getItem("user");
    let senderPic = document.querySelector('.myself-pic').src;
    let senderName = document.querySelector('.myself-name').textContent;
    if (meter < 1) {
        document.querySelector('.broadcast-error-msg').textContent = "請輸入正確的公里數(>0km)";
        document.querySelector('.broadcast-error-msg').style.display = "block";
        document.querySelector('.broadcast-success-msg').style.display = "none";
    } else if (content === "" || content.replace(/ /g, "") === "") {
        document.querySelector('.broadcast-error-msg').textContent = "請輸入訊息內容";
        document.querySelector('.broadcast-error-msg').style.display = "block";
        document.querySelector('.broadcast-success-msg').style.display = "none";
    } else {
        let messageList = broadcastFriend(meter);
        if (messageList.length === 0) {
            document.querySelector('.broadcast-error-msg').textContent = "此公里數內目前沒有好友";
            document.querySelector('.broadcast-error-msg').style.display = "block";
            document.querySelector('.broadcast-success-msg').style.display = "none";
        } else {
            for (let i = 0; i < messageList.length; i++) {
                socket.emit("broadcastMessage", senderPic, senderName, messageList[i].roomID, content);
                fetch('/message', {
                    method: 'POST',
                    body: JSON.stringify({ sender: sender, roomID: messageList[i].roomID, content: content }),
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
                            socket.emit("sendMessageInform", sender, messageList[i].roomID);
                        }
                    })
            }
            broadcastMsgInput.value = "";
            document.querySelector('.broadcast-error-msg').style.display = "none";
            document.querySelector('.broadcast-success-msg').textContent = "訊息發送成功";
            document.querySelector('.broadcast-success-msg').style.display = "block";
        }
    }
}

// 按enter送出對話
broadcastMsgInput.addEventListener("keydown", (e) => {
    if (e.keyCode === 13 && e.shiftKey === false) {
        e.preventDefault()
        broadcastMessage();
    }
})

// 發送現在位置進後端資料庫
function sendLocation() {
    let user = localStorage.getItem("user");
    let data = {
        email: user,
        latlng: `{lat: ${latlngNow.lat}, lng: ${latlngNow.lng}}`
    }
    if (user != null) {
        fetch('/latlng', {
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
                    console.log(result.message);
                }
            })
    }

}

// 將好友位置放到地圖上
function putFriendOnMap(result) {
    friendData = result.data;
    for (let i = 0; i < result.data.length; i++) {
        if (result.data[i].latlng !== null) {
            let latlng = eval('(' + result.data[i].latlng + ')');
            let updateTime = moment(result.data[i].latlng_update).fromNow();
            let markerIcon = L.icon({
                iconUrl: '../icon/marker.png',
                iconSize: [60, 60],
                iconAnchor: [28, 45],
                className: 'marker-icon'
            });
            L.marker(latlng, { icon: markerIcon }).addTo(map);
            let friendMapPic = '../icon/user.png';
            if (result.data[i].pic !== "undefined") {
                friendMapPic = result.data[i].pic;
            }
            let friendIcon = L.icon({
                iconUrl: friendMapPic,
                iconSize: [40, 40],
                iconAnchor: [18, 42],
                popupAnchor: [3, -45],
                className: 'map-icon'
            });
            L.marker(latlng, { icon: friendIcon }).addTo(map).bindPopup(`<strong>${result.data[i].username}</strong><br>location update: ${updateTime}`);
        }
    }
}

socket.on("broadcastMessage", (senderPic, senderName, content, roomID) => {
    let pic = "../icon/user.png"
    if (senderPic !== "undefined") {
        pic = senderPic;
    }
    document.querySelector('.receive-broadcast-pic').src = pic;
    document.querySelector('.receive-broadcast-name').textContent = `${senderName} 發送了廣播訊息給你：`;
    document.querySelector('.receive-broadcast-msg').textContent = content;
    document.getElementById('response-broadcast-btn').setAttribute('data-room', roomID);
    document.querySelector('.shadow').style.display = "block";
    document.querySelector('.receive-broadcast-div').style.display = "block";
});
