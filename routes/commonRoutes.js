const express = require('express')
const commonRoute = express.Router()
const jwt = require('jsonwebtoken')
const DB_Service = require('../models/mysql')
const db_Service = new DB_Service()
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const { uploadFile } = require('../models/s3')
const { v4: uuidv4 } = require('uuid')
const moment = require('moment')

commonRoute.patch('/verify', (req, res) => {
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

commonRoute.get('/member', async (req, res) => {
    try {
        let email = req.headers['user']
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

commonRoute.get('/friend', async (req, res) => {
    try {
        let myEmail = req.headers['user']
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

commonRoute.post('/friend', async (req, res) => {
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

commonRoute.patch('/member', upload.single('newPic'), async (req, res) => {
    try {
        let file = req.file
        let name = req.body.newName
        let email = req.body.email
        let filename
        if (typeof (file) !== "undefined") {
            let s3result = await uploadFile(file)
            filename = "https://d1ggvmbnmq1itc.cloudfront.net/" + file.filename
            await db_Service.updateMemberPic(email, filename)
        }
        if (name !== "") {
            await db_Service.updateMemberName(email, name)
        }
        res.json({ ok: true, pic: filename })
    } catch (err) {
        console.log(err)
        res.json({
            error: true, message: "伺服器內部錯誤"
        })
    }
})

commonRoute.get('/inform', async (req, res) => {
    try {
        let email = req.headers['user']
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

commonRoute.post('/request', async (req, res) => {
    try {
        let myID = req.body.myID
        let friendID = req.body.friendID
        let randomRoomId = uuidv4()
        let timeNow = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
        await db_Service.addFriendRequest(myID, friendID, randomRoomId)
        await db_Service.updateFriendRequest(myID, friendID, randomRoomId)
        let result = await db_Service.getMemberData(friendID)
        await db_Service.deleteInform(myID, friendID, 1)
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

commonRoute.delete('/request', async (req, res) => {
    try {
        let myID = req.body.myID
        let friendID = req.body.friendID
        await db_Service.deleteFriendRequest(friendID, myID)
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

module.exports = commonRoute
