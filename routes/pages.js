const express = require('express')
const page = express.Router()

page.get('/', (req, res) => {
    res.render('index')
})

page.get('/map', (req, res) => {
    res.render('map')
})

page.get('/chat/:roomID', (req, res) => {
    res.render('chat')
})

module.exports = page