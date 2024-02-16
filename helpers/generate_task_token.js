var jwt = require('jsonwebtoken')

var task = {
    id: 'quiz2_02',
    idUserAnswer: '',
    sAnswer: '',
    platformName: 'test',
    randomSeed: '0',
    hints_requested: [],
    itemUrl: 'http://localhost/?taskID=quiz2_02'
}

var token = jwt.sign(task, 'buddy')
console.log(token)