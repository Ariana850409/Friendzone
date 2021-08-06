const GoogleStrategy = require('passport-google-oauth20').Strategy
const DB_Service = require('./mysql')
const db_Service = new DB_Service()
require('dotenv').config()

module.exports = function (passport) {
    passport.use(new GoogleStrategy({
        clientID: process.env.Google_Client_ID,
        clientSecret: process.env.Google_Client_Secret,
        callbackURL: 'https://friendzone.tw/auth/google/callback'
    },
        async (accessToken, refreshToken, profile, done) => {
            let email = profile.emails[0].value
            let name = profile.displayName
            let pic = profile.photos[0].value
            try {
                let result = await db_Service.isEmailExist(email)
                if (result.length === 0) {
                    await db_Service.insertMember(name, email, accessToken, pic)
                    done(null, email)
                } else {
                    done(null, email)
                }
            } catch (err) {
                console.error(err)
            }
        }))
}