const express = require('express')
const mapRoute = express.Router()
const DB_Service = require('../models/mysql')
const db_Service = new DB_Service()
const moment = require('moment')

mapRoute.post('/latlng', async (req, res) => {
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

module.exports = mapRoute
