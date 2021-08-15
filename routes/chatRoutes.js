const express = require('express')
const chatRoute = express.Router()
const DB_Service = require('../models/mysql')
const db_Service = new DB_Service()
const moment = require('moment')

chatRoute.get('/chatroom', async (req, res) => {
    try {
        let email = req.headers['user']
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

chatRoute.get('/message', async (req, res) => {
    try {
        let email = req.headers['user']
        let roomID = req.headers['room']
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

chatRoute.post('/message', async (req, res) => {
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

module.exports = chatRoute
