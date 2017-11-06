var jwt = require('jsonwebtoken')
var key = 'buddy'

/*
// task
var data = {
    id: 1,
    random_seed: 1,
    hintsRequested: {
        a: 'a',
        b: 'b'
    }
}
*/
// answer
var data = {
    test_answer_value: 'test'
}

var token = jwt.sign(data, key)
console.log(token)

jwt.verify(token, key, function(err, decoded) {
    err && console.error(err)
    console.log(decoded)
});