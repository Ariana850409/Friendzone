require('dotenv').config()
const fs = require('fs')
const S3 = require('aws-sdk/clients/s3')

const bucketName = process.env.S3_Bucket
const region = process.env.S3_Region
const accessKeyId = process.env.S3_Key
const secretAccessKey = process.env.S3_Secret
const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey
})

function uploadFile(file) {
    const fileStream = fs.createReadStream(file.path)
    const uploadParams = {
        Bucket: bucketName,
        Body: fileStream,
        Key: file.filename,
        ContentType: 'image/jpeg',
        ACL: 'public-read'
    }
    return s3.upload(uploadParams).promise()
}

exports.uploadFile = uploadFile