var jwt = require('jsonwebtoken')

var task = {
    id: 'quiz',
    idUserAnswer: '',
    sAnswer: '',
    platformName: 'test',
    randomSeed: '0',
    hints_requested: [],
    itemUrl: 'http://localhost/?taskID=quiz'
}

var token = jwt.sign(task, 'buddy')
console.log(token)