const cloudinary = require("cloudinary").v2
cloudinary.config({
    api_key : process.env.api_key,
    cloud_name : process.env.cloud_name,
    api_secret : process.env.api_secret
})

module.exports = cloudinary

