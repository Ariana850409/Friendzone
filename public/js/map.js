let latlngNow;

// 建立 Leaflet 地圖
let map = L.map('mapid', { attributionControl: false });

// 設定經緯度座標
// map.setView(new L.LatLng(22.992, 120.239), 12);
let mysite = map.locate({ setView: true });

// 設定圖資來源
let osmUrl = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
let osm = new L.TileLayer(osmUrl, { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', minZoom: 8, maxZoom: 16 });
L.control.attribution({
    position: 'bottomleft'
}).addTo(map);
map.addLayer(osm);

var peopleIcon = L.icon({
    iconUrl: '../icon/user.png',
    iconSize: [38, 38], // size of the icon
    iconAnchor: [18, 24], // point of the icon which will correspond to marker's location
    popupAnchor: [-3, -56] // point from which the popup should open relative to the iconAnchor
});
L.marker([22.992, 120.339], { icon: peopleIcon }).addTo(map).bindPopup("Anna");

let marker = L.marker([22.992, 120.239]).addTo(map);
let circle = L.circle(
    [22.988, 120.220],   // 圓心座標
    1000,                // 半徑（公尺）
    {
        color: 'red',      // 線條顏色
        fillColor: '#f03', // 填充顏色
        fillOpacity: 0.5   // 透明度
    }
).addTo(map);
let polygon = L.polygon([
    [22.992, 120.289],
    [22.982, 120.299],
    [22.970, 120.267],
    [22.990, 120.267]
]).addTo(map);

marker.bindPopup("<strong>地標</strong><br>標示的位置。").openPopup();
circle.bindPopup("這是圓圈。");
polygon.bindPopup("這是多邊形。");

let popup = L.popup();
function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("經緯度座標：" + e.latlng.toString())
        .openOn(map);
}
map.on('click', onMapClick);

// 進行定位
function onLocationFound(e) {
    latlngNow = e.latlng;
    console.log(e);
    console.log(latlngNow);
    let radius = e.accuracy;
    L.marker(e.latlng).addTo(map)
        .bindPopup("You are within " + radius + " meters from this point").openPopup();

    L.circle(e.latlng, radius).addTo(map);
    sendLocation();
}
map.on('locationfound', onLocationFound);

// 不允許定位or抓不到定位
function onLocationError(e) {
    map.setView(new L.LatLng(25.039005, 121.564692), 12);
    alert(e.message);
}
map.on('locationerror', onLocationError);

// 地圖回到現在位置
$('.locationNow').on('click', function () {
    map.panTo(latlngNow);
});


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
                console.log(result);
            })
    }

}