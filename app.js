const express = require('express')
require('dotenv').config()
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const { uploadFile } = require('./s3')
const DB_Service = require('./mysql')
const db_Service = new DB_Service()
const jwt = require('jsonwebtoken')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
app.use(express.json())
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/icon', express.static(__dirname + 'public/icon'))
app.set('views', './views')
app.set('view engine', 'ejs')


app.get('/', (req, res) => {
    res.render('index')
})

app.get('/map', (req, res) => {
    res.render('map')
})


app.get('/chat/:roomID', (req, res) => {
    res.render('chat')
    //(req.params.id)
})

app.post('/register', upload.single('pic'), async (req, res) => {
    try {
        let file = req.file
        let name = req.body.name
        let email = req.body.email
        let password = req.body.password
        let filename = "undefined"
        if (typeof (file) != "undefined") {
            let s3result = await uploadFile(file)
            filename = "https://d1ggvmbnmq1itc.cloudfront.net/" + file.filename
        }
        let isexist = await db_Service.isEmailExist(email)
        if (isexist.length != 0) {
            res.json({
                error: true, message: "此電子郵件已被註冊過"
            })
            return
        }
        await db_Service.insertMember(name, email, password, filename)
        res.json({ ok: true })
    } catch (err) {
        console.log(err)
        res.json({
            error: true, message: "伺服器內部錯誤"
        })
    }
})

app.patch('/login', async (req, res) => {
    try {
        let loginEmail = req.body.email
        let loginPassword = req.body.password
        let result = await db_Service.checkMember(loginEmail, loginPassword)
        if (result.length != 0 && result[0].password == loginPassword) {
            let user = {
                email: loginEmail,
            }
            jwt.sign({ user }, 'temp_secretkey', { expiresIn: '24h' }, (err, token) => {
                res.json({
                    ok: true,
                    token: token
                })
            })
            return
        } else {
            res.json({
                error: true, message: "電子郵件或密碼輸入錯誤"
            })
        }
    } catch (err) {
        console.log(err)
        res.json({
            error: true, message: "伺服器內部錯誤"
        })
    }
})

app.patch('/verify', (req, res) => {
    try {
        let bearerHeader = req.headers['authorization']
        if (typeof bearerHeader !== 'undefined') {
            let bearerToken = bearerHeader.split(' ')[1]
            req.token = bearerToken
        } else {
            res.json({
                error: true, message: "尚未取得bearerToken"
            })
            return
        }
        jwt.verify(req.token, 'temp_secretkey', (err, authData) => {
            if (err) {
                res.json({
                    error: true, message: "token驗證失敗"
                })
                return
            } else {
                res.json({
                    ok: true,
                    data: authData
                })
            }
        })
    } catch (err) {
        console.log(err)
        res.json({
            error: true, message: "伺服器內部錯誤"
        })
    }
})

app.post('/latlng', async (req, res) => {
    try {
        let email = req.body.email
        let latlng = req.body.latlng
        let timeNow = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
        await db_Service.updateLatlng(email, latlng, timeNow)
        res.json({
            ok: true,
        })
    } catch (err) {
        console.log(err)
        res.json({
            error: true, message: "伺服器內部錯誤"
        })
    }
})

app.post('/getMember', async (req, res) => {
    try {
        let email = req.body.email
        let result = await db_Service.getMemberData(email)
        res.json({
            ok: true,
            data: result
        })
    } catch (err) {
        console.log(err)
        res.json({
            error: true, message: "伺服器內部錯誤"
        })
    }
})

app.post('/getFriendData', async (req, res) => {
    try {
        let myEmail = req.body.email
        let result = await db_Service.getFriendData(myEmail)
        res.json({
            ok: true,
            data: result
        })
    } catch (err) {
        console.log(err)
        res.json({
            error: true, message: "伺服器內部錯誤"
        })
    }
})

app.post('/addFriend', async (req, res) => {
    try {
        let user = req.body.user
        let friend = req.body.friend
        let roomID;
        if (user === friend) {
            res.json({
                error: true, message: "無法新增自己為好友"
            })
            return
        }
        let isFriendExist = await db_Service.isEmailExist(friend)
        if (isFriendExist.length == 0) {
            res.json({
                error: true, message: "查無此好友帳號"
            })
            return
        }
        let isRequestExist = await db_Service.isRequestExist(user, friend)
        if (isRequestExist.length != 0) {
            res.json({
                error: true, message: "已發送過好友邀請"
            })
            return
        }
        await db_Service.addFriendRequest(user, friend, roomID)
        let result = await db_Service.getMemberData(user)
        let myname = result[0].username
        let mypic = result[0].pic
        // 加完好友向對方發送通知
        await db_Service.addInform(friend, myname, user, mypic, 1, roomID)
        res.json({
            ok: true
        })
    } catch (err) {
        console.log(err)
        res.json({
            error: true, message: "伺服器內部錯誤"
        })
    }
})

app.post('/getInform', async (req, res) => {
    try {
        let email = req.body.email
        let result = await db_Service.getInform(email)
        res.json({
            ok: true,
            data: result
        })
    } catch (err) {
        console.log(err)
        res.json({
            error: true, message: "伺服器內部錯誤"
        })
    }
})

app.post('/acceptRequest', async (req, res) => {
    try {
        let myID = req.body.myID
        let friendID = req.body.friendID
        let randomRoomId = uuidv4()
        let timeNow = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
        await db_Service.addFriendRequest(myID, friendID, randomRoomId)
        await db_Service.updateFriendRequest(myID, friendID, randomRoomId)
        let result = await db_Service.getMemberData(friendID)
        // 接受好友邀請後刪除通知
        await db_Service.deleteInform(myID, friendID, 1)
        // 系統發送成為好友公告
        await db_Service.addConversation('system', randomRoomId, '你與對方已成為好友，開始聊天吧！', timeNow)
        await db_Service.updateLatestMsg(randomRoomId, '你與對方已成為好友，開始聊天吧！', timeNow)
        res.json({
            ok: true,
            data: result,
            room: randomRoomId
        })
    } catch (err) {
        console.log(err)
        res.json({
            error: true, message: "伺服器內部錯誤"
        })
    }
})

app.delete('/rejectRequest', async (req, res) => {
    try {
        let myID = req.body.myID
        let friendID = req.body.friendID
        let result = await db_Service.deleteFriendRequest(friendID, myID)
        // 拒絕好友邀請後刪除通知
        await db_Service.deleteInform(myID, friendID, 1)
        res.json({
            ok: true,
        })
    } catch (err) {
        console.log(err)
        res.json({
            error: true, message: "伺服器內部錯誤"
        })
    }
})

app.post('/getChatList', async (req, res) => {
    try {
        let email = req.body.email
        let result = await db_Service.getChatList(email)
        res.json({
            ok: true,
            data: result
        })
    } catch (err) {
        console.log(err)
        res.json({
            error: true, message: "伺服器內部錯誤"
        })
    }
})

app.post('/getChatData', async (req, res) => {
    try {
        let email = req.body.email
        let roomID = req.body.roomID
        let result = await db_Service.getConversation(roomID)
        let friendData = await db_Service.getChatroomFriend(roomID, email)
        res.json({
            ok: true,
            data: result,
            friend: friendData
        })
    } catch (err) {
        console.log(err)
        res.json({
            error: true, message: "伺服器內部錯誤"
        })
    }
})

app.post('/sendMessage', async (req, res) => {
    try {
        let sender = req.body.sender
        let roomID = req.body.roomID
        let content = req.body.content
        let timeNow = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
        await db_Service.addConversation(sender, roomID, content, timeNow)
        await db_Service.updateLatestMsg(roomID, content, timeNow)
        let friend = await db_Service.getChatroomFriend(roomID, sender)
        let receiver = friend[0].email
        let myself = await db_Service.getMemberData(sender)
        let myname = myself[0].username
        let mypic = myself[0].pic
        await db_Service.deleteInform(receiver, sender, 2)
        await db_Service.addInform(receiver, myname, sender, mypic, 2, roomID)
        res.json({
            ok: true,
        })
    } catch (err) {
        console.log(err)
        res.json({
            error: true, message: "伺服器內部錯誤"
        })
    }
})


// 建立table -> members
app.get('/createtable/members', async (req, res) => {
    try {
        await db_Service.table_mambers()
        res.send('Create Table members Success...')
    } catch (err) {
        console.log(err)
        res.send('Fail')
    }

})

// 建立table -> friendlist
app.get('/createtable/friendlist', async (req, res) => {
    try {
        await db_Service.table_friendlist()
        res.send('Create Table friendlist Success...')
    } catch (err) {
        console.log(err)
        res.send('Fail')
    }
})

// 建立table -> notification
app.get('/createtable/notification', async (req, res) => {
    try {
        await db_Service.table_notification()
        res.send('Create Table notification Success...')
    } catch (err) {
        console.log(err)
        res.send('Fail')
    }
})

// 建立table -> conversation
app.get('/createtable/conversation', async (req, res) => {
    try {
        await db_Service.table_conversation()
        res.send('Create Table conversation Success...')
    } catch (err) {
        console.log(err)
        res.send('Fail')
    }
})

app.get('/timetest', async (req, res) => {
    try {
        //2021-07-18 16:38:54 string
        let now = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
        // Moment<2021-07-18T16:38:54+08:00> object
        let now_2 = moment(now)
        // string跟object可以直接比
        moment(now).isBefore(time)
        res.send('ok')
    } catch (err) {
        console.log(err)
        res.send('Fail')
    }
})


server.listen(8080)
// 當發生連線事件
io.on('connection', (socket) => {
    let userEmail;

    // 加入所有已存在的room(包括自己)
    socket.on("joinRoom", async (email) => {
        userEmail = email
        socket.join(email);
        let result = await db_Service.getRoomData(userEmail)
        if (result.length !== 0) {
            for (let i = 0; i < result.length; i++) {
                socket.join(result[i].roomID);
            }
        }
    })
    // 自己加入新增加的room
    socket.on("joinNewRoom", (roomID, status) => {
        socket.join(roomID)
        if (status === 1) {
            io.to(roomID).emit("becomeFriend", "你與對方已成為朋友")
        }
    })
    // 叫朋友加入新增加的room
    socket.on("friendJoinNewRoom", (friendID, roomID) => {
        io.to(friendID).emit("askJoinRoom", roomID)
    })

    let timeNow = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
    socket.on("sendMessage", async (sender, room, content) => {
        io.to(room).emit("receiveMessage", sender, room, content, timeNow)
    })

    // 發送好友邀請後即時通知
    socket.on("sendFriendRequest", async (sender, receiver) => {
        let result = await db_Service.getRequestInform(sender, receiver)
        if (result.length !== 0) {
            io.to(receiver).emit("receiveFriendRequest", result)
        }
    })

    // 發送新訊息後即時通知
    socket.on("sendMessageInform", async (sender, room) => {
        let result = await db_Service.getMessageInform(sender, room)
        if (result.length !== 0) {
            io.to(result[0].userEmail).emit("receiveMessageInform", result)
        }
    })

    // 撥出通話後通知
    socket.on("callFriend", async (caller, roomID) => {
        let result = await db_Service.getMemberData(caller)
        if (result.length !== 0) {
            socket.broadcast.to(roomID).emit("receiveCall", result, roomID)
        }
    })

    // 撥出通話後通知
    socket.on("answerCall", async (roomID, response) => {
        socket.broadcast.to(roomID).emit("answerCall", roomID, response)
    })

    socket.on('peerConnectSignaling', ({ desc, candidate }, roomID) => {
        socket.broadcast.to(roomID).emit('peerConnectSignaling', ({ desc, candidate }))
    })

    socket.on('endCall', (roomID) => {
        socket.broadcast.to(roomID).emit('endCall')
    })



    // socket.on("test", () => {
    //     io.to(userEmail).emit('test event', "control ok");
    // })


    // socket.on("send", (msg) => {
    //     // 如果 msg 內容鍵值小於 2 等於是訊息傳送不完全
    //     // 2這個長度則是因為我們的訊息內寫包含有兩個東西(暱稱.訊息本體)
    //     // 因此我們直接 return ，終止函式執行。
    //     // if (Object.keys(msg).length < 2) return;

    //     // 廣播訊息到聊天室
    //     io.emit("msg", msg);
    // });

    // socket.on('user-reconnected', function (username) {
    //     console.log(username + ' just reconnected');
    // });

    // // 當發生離線事件
    // socket.on('disconnect', () => {
    //     // console.log('Bye~');  // 顯示 bye~
    // });
});
