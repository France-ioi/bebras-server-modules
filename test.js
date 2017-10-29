var jwt = require('jsonwebtoken');
var key = 'buddy';

var token = jwt.sign({ task_id: 1, random_seed: 1}, key);
console.log(token);

jwt.verify(token, key, function(err, decoded) {
    console.error(err);
    console.log(decoded)
});