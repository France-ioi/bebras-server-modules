var platforms = require('../repositories/platforms')
var jwt = require('jsonwebtoken')

module.exports = {

    path: '/tokens',


    params: {
        verify: ['token'],
    },


    actions: {

        verify: function(args, callback) {
            var payload = jwt.decode(args.token)
            if(!payload || !payload.platformName) {
                return callback(new Error('Invalid token'))
            }
            platforms.getByName(payload.platformName, (error, platform) => {
                if(error) {
                    return callback(error)
                }
                jwt.verify(args.token, platform.public_key, (error, data) => {
                    callback(error)
                })
            })
        }

    }
}