var jwt = require('jsonwebtoken')
var key = 'buddy'

// task
var data = {
    id: 'test-server-modules',
    random_seed: 1,
    hintsRequested: {
        a: 'a',
        b: 'b'
    }
}
/*
// answer
var data = {
    test_answer_value: 'test'
}
*/



var token = jwt.sign(data, key)
console.log(token)

jwt.verify(token, key, function(err, decoded) {
    err && console.error(err)
    console.log(decoded)
});