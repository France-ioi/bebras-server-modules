module.exports = {

    default: process.env.STORAGE || 'local',

    url: process.env.STORAGE_URL,

    local: {
        path: process.env.STORAGE_PATH,
    },


    s3: {
        key: process.env.S3_KEY,
        secret: process.env.S3_SECRET,
        region: process.env.S3_REGION,
        bucket: process.env.S3_BUCKET
    }
}