const express = require('express')
const app = express()
const DB_Service = require('./models/mysql')
const db_Service = new DB_Service()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const moment = require('moment')
app.use(express.json())
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/icon', express.static(__dirname + 'public/icon'))
app.set('views', './views')
app.set('view engine', 'ejs')


const pages = require('./routes/pages')
const indexRoutes = require('./routes/indexRoutes')
const commonRoutes = require('./routes/commonRoutes')
const mapRoutes = require('./routes/mapRoutes')
const chatRoutes = require('./routes/chatRoutes')
app.use(pages)
app.use(indexRoutes)
app.use(commonRoutes)
app.use(mapRoutes)
app.use(chatRoutes)


server.listen(8080)
io.on('connection', (socket) => {
    socket.on("joinRoom", async (email) => {
        socket.join(email);
        let result = await db_Service.getRoomData(email)
        if (result.length !== 0) {
            for (let i = 0; i < result.length; i++) {
                socket.join(result[i].roomID);
            }
        }
    })

    socket.on("joinNewRoom", (roomID, status) => {
        socket.join(roomID)
        if (status === 1) {
            io.to(roomID).emit("becomeFriend", "你與對方已成為朋友")
        }
    })

    socket.on("friendJoinNewRoom", (friendID, roomID) => {
        io.to(friendID).emit("askJoinRoom", roomID)
    })

    let timeNow = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
    socket.on("sendMessage", async (sender, room, content) => {
        io.to(room).emit("receiveMessage", sender, room, content, timeNow)
    })

    socket.on("sendFriendRequest", async (sender, receiver) => {
        let result = await db_Service.getRequestInform(sender, receiver)
        if (result.length !== 0) {
            io.to(receiver).emit("receiveFriendRequest", result)
        }
    })

    socket.on("sendMessageInform", async (sender, room) => {
        let result = await db_Service.getMessageInform(sender, room)
        if (result.length !== 0) {
            io.to(result[0].userEmail).emit("receiveMessageInform", result)
        }
    })

    socket.on("callFriend", async (caller, roomID) => {
        let result = await db_Service.getMemberData(caller)
        if (result.length !== 0) {
            socket.broadcast.to(roomID).emit("receiveCall", result, roomID)
        }
    })

    socket.on("answerCall", async (roomID, response) => {
        socket.broadcast.to(roomID).emit("answerCall", roomID, response)
    })

    socket.on('peerConnectSignaling', ({ desc, candidate }, roomID) => {
        socket.broadcast.to(roomID).emit('peerConnectSignaling', ({ desc, candidate }))
    })

    socket.on('endCall', (roomID) => {
        socket.broadcast.to(roomID).emit('endCall')
    })

    socket.on('blurBackground', (roomID, isBackground) => {
        socket.broadcast.to(roomID).emit('blurBackground', isBackground)
    })

    socket.on('broadcastMessage', (senderPic, senderName, roomID, content) => {
        socket.broadcast.to(roomID).emit('broadcastMessage', senderPic, senderName, content, roomID)
    })
});
