const express = require('express')
const indexRoute = express.Router()
const DB_Service = require('../models/mysql')
const db_Service = new DB_Service()
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const { uploadFile } = require('../models/s3')
const jwt = require('jsonwebtoken')
const passport = require('passport')
require('../models/passport')(passport)
express(passport.initialize())

indexRoute.post('/register', upload.single('pic'), async (req, res) => {
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

indexRoute.patch('/login', async (req, res) => {
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

indexRoute.get('/auth/google', passport.authenticate('google', { session: false, scope: ['profile', 'email'] }))

indexRoute.get('/auth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/' }),
    (req, res) => {
        let user = {
            email: req.user,
        }
        jwt.sign({ user }, 'temp_secretkey', { expiresIn: '24h' }, (err, token) => {
            const htmlWithEmbeddedJWT = `
            <html>
            <script>
                window.localStorage.setItem('token', '${token}');
                window.location.href = '/map';
            </script>
            </html>
            `
            res.send(htmlWithEmbeddedJWT);
        })
    }
)

module.exports = indexRoute
