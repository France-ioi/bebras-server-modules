var jwt = require('jsonwebtoken')

/*
//var token = 'eyJhbGciOiJSUzUxMiJ9.eyJzTG9naW4iOiJtb2J5ZGltazIyIiwiYklzQWRtaW4iOiIwIiwiaWRVc2VyIjoiNTc4NTg1MzAxMDYzNTg5MDIiLCJpZEl0ZW0iOiIxMTExIiwiYkhpbnRzQWxsb3dlZCI6IjAiLCJzU3VwcG9ydGVkTGFuZ1Byb2ciOiIqIiwiYkFjY2Vzc1NvbHV0aW9ucyI6IjEiLCJpdGVtVXJsIjoiaHR0cDpcL1wvYmVicmFzLXRhc2tzLmRldlwvbW9kdWxlX3Rlc3RpbmdcL3Rlc3QtcHJpbnRcLyIsImlkSXRlbUxvY2FsIjoiMTc0Nzc3MTY5NDc3OTgwMDY2NSIsImJTdWJtaXNzaW9uUG9zc2libGUiOnRydWUsIm5iSGludHNHaXZlbiI6IjAiLCJiSGludFBvc3NpYmxlIjp0cnVlLCJpZFRhc2siOiIxMTExIiwiYlJlYWRBbnN3ZXJzIjp0cnVlLCJyYW5kb21TZWVkIjowLCJwbGF0Zm9ybU5hbWUiOiJodHRwOlwvXC9hbGdvcmVhLnBlbS5kZXYiLCJkYXRlIjoiMjItMTEtMjAxNyJ9.KEZo5QQ_1lbeQ_LS44z43Yal3jYfrNUHIqfEXGKdOH8bZIbDzj8Px825mHexxREo7zzBEeD02wX6odN_Mdg-ZIKYmS5hiPf_bpLenXVRDghgapEiTgtpPMrD8vFYH7zmzD4wUggx5jx_7TTWAPbNGYLRTeGfKpZQw6EbyP1eNy4'
var token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybU5hbWUiOiJ0ZXN0IiwicmFuZG9tU2VlZCI6IjAiLCJoaW50c19yZXF1ZXN0ZWQiOltdLCJpdGVtVXJsIjoiaHR0cDovL2xvY2FsaG9zdC8_dGFza0lEPXRlc3Qtc2VydmVyLW1vZHVsZXMiLCJpYXQiOjE1NTIwNjU0OTh9.TVyFchUnyZD_EXo1BZhLkCpEdNuUYx2lUf1zS9Q3xXk';


var data = jwt.decode(token)
console.log(data)


/*
var task = {
    platformName: 'test',
    randomSeed: '0',
    hints_requested: [],
    itemUrl: 'http://localhost/?taskID=test-server-modules'
}
var token = jwt.sign(task, 'buddy')
console.log(token)
*/

var safeEval = require('safe-eval')
var str = '[0,[1, 2],f1unction(val) { return val == \'2\'}]';


//console.log(grader[2]('2'));
try {
    var grader = safeEval(str)

} catch(e) {
    console.log(e.message)
}
console.log('grader', grader);

