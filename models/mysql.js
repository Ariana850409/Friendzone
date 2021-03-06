const mysql = require('mysql2')
require('dotenv').config()
const dbHost = process.env.DB_Host
const dbUser = process.env.DB_User
const dbPassword = process.env.DB_Password

const pool = mysql.createPool({
    host: dbHost,
    user: dbUser,
    password: dbPassword,
    database: 'Friendzone',
    waitForConnections: true,
    connectionLimit: 10,
})


class DB_Service {
    // 確認此帳號是否被註冊過 
    isEmailExist(email) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT email FROM members WHERE email = '${email}'`
            pool.query(sql, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 註冊會員進資料庫
    insertMember(name, email, password, filename) {
        return new Promise((resolve, reject) => {
            let body = { username: name, email: email, password: password, pic: filename }
            let sql = `INSERT INTO members SET ?`
            pool.query(sql, body, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 核對會員帳密
    checkMember(email) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT email,password FROM members WHERE email = '${email}'`
            pool.query(sql, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 加入/更新經緯度進資料庫
    updateLatlng(email, latlng, timeNow) {
        return new Promise((resolve, reject) => {
            let sql = `UPDATE members SET latlng = '${latlng}',latlng_update = '${timeNow}' WHERE email = '${email}'`
            pool.query(sql, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 更新會員照片
    updateMemberPic(email, filename) {
        return new Promise((resolve, reject) => {
            let sql = `UPDATE members SET pic = '${filename}' WHERE email = '${email}'`
            pool.query(sql, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 更新會員名稱
    updateMemberName(email, name) {
        return new Promise((resolve, reject) => {
            let sql = `UPDATE members SET username = '${name}' WHERE email = '${email}'`
            pool.query(sql, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 拿會員個人資料
    getMemberData(email) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT username,pic FROM members WHERE email = '${email}'`
            pool.query(sql, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 拿互為好友的好友資料
    getFriendData(email) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT members.username,members.email,members.pic,members.latlng,
                DATE_FORMAT(members.latlng_update, '%Y-%m-%d %H:%i:%s') AS latlng_update,
                friendlist.roomID FROM friendlist INNER JOIN members ON 
                friendlist.user=members.email WHERE friendlist.friend='${email}' AND 
                roomID IS NOT NULL`
            pool.query(sql, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 確認是否已發過好友邀請
    isRequestExist(user, friend) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT * FROM friendlist WHERE user = '${user}' AND friend = '${friend}'`
            pool.query(sql, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 新增好友邀請or接受好友邀請
    addFriendRequest(user, friend, roomID) {
        return new Promise((resolve, reject) => {
            let body = { user: user, friend: friend, roomID: roomID }
            let sql = `INSERT INTO friendlist SET ?`
            pool.query(sql, body, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 接受好友邀請後對方新增共同的room
    updateFriendRequest(user, friend, roomId) {
        return new Promise((resolve, reject) => {
            let sql = `UPDATE friendlist SET roomId = '${roomId}' WHERE user = '${friend}' AND friend = '${user}'`
            pool.query(sql, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 拒絕好友邀請
    deleteFriendRequest(user, friend) {
        return new Promise((resolve, reject) => {
            let sql = `DELETE FROM friendlist WHERE user ='${user}' AND friend='${friend}'`
            pool.query(sql, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 新增通知列表
    // content-> 1:發送好友邀請 2:發送訊息
    addInform(friend, myname, user, mypic, content, roomID) {
        return new Promise((resolve, reject) => {
            let body = { userEmail: friend, friendName: myname, friendEmail: user, friendPic: mypic, content: content, roomID: roomID }
            let sql = `INSERT INTO notification SET ?`
            pool.query(sql, body, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 取得通知列表
    // content-> 1:發送好友邀請 2:發送訊息
    getInform(myEmail) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT friendName,friendEmail,friendPic,content,roomID FROM notification WHERE userEmail = '${myEmail}' ORDER BY id DESC`
            pool.query(sql, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 取得單一通知列表（即時好友邀請）
    // content-> 1:發送好友邀請
    getRequestInform(sender, receiver) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT friendName,friendEmail,friendPic,content FROM notification WHERE userEmail = '${receiver}' AND friendEmail = '${sender}'`
            pool.query(sql, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 取得單一通知列表（即時訊息通知）
    // content-> 2:發送新訊息
    getMessageInform(sender, room) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT userEmail,friendName,friendEmail,friendPic,content,roomID FROM notification WHERE friendEmail = '${sender}' AND roomID = '${room}'`
            pool.query(sql, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }



    // 刪除通知列表
    deleteInform(myID, friendID, status) {
        return new Promise((resolve, reject) => {
            let sql = `DELETE FROM notification WHERE userEmail ='${myID}' AND friendEmail='${friendID}' AND content=${status}`
            pool.query(sql, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 拿一對一聊天的room
    getRoomData(email) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT roomID FROM friendlist WHERE user = '${email}' AND roomID IS NOT NULL`
            pool.query(sql, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 新增對話進資料庫
    addConversation(sender, roomID, content, timeNow) {
        return new Promise((resolve, reject) => {
            let body = { sender: sender, roomID: roomID, content: content, time: timeNow }
            let sql = `INSERT INTO conversation SET ?`
            pool.query(sql, body, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 取得對話內容
    getConversation(roomID) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT sender,content,DATE_FORMAT(time, '%Y-%m-%d %H:%i:%s') AS time FROM conversation WHERE roomID = '${roomID}'`
            pool.query(sql, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 更新最後一句話的內容及時間
    updateLatestMsg(roomID, content, timeNow) {
        return new Promise((resolve, reject) => {
            let sql = `UPDATE friendlist SET latestMessage = '${content}',latestTime = '${timeNow}' WHERE roomID = '${roomID}'`
            pool.query(sql, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 拿聊天室側邊欄
    getChatList(email) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT members.username,members.pic,friendlist.roomID,
            friendlist.latestMessage,DATE_FORMAT(friendlist.latestTime,'%Y-%m-%d %H:%i:%s') 
            AS latestTime FROM members INNER JOIN friendlist ON members.email=friendlist.friend 
            WHERE friendlist.user='${email}' AND friendlist.roomID IS NOT NULL ORDER BY 
            friendlist.latestTime DESC;`
            pool.query(sql, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }

    // 拿聊天室內的好友資料
    getChatroomFriend(roomID, email) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT members.username,members.pic,members.email FROM members INNER 
            JOIN friendlist ON friendlist.friend=members.email WHERE friendlist.roomID
             ='${roomID}' AND members.email !='${email}'`
            pool.query(sql, (err, result) => {
                if (err) reject(new Error(err.message))
                resolve(result)
            })
        })
    }
}

module.exports = DB_Service