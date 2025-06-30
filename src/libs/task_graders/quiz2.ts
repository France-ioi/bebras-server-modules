var safeEval = require('safe-eval')
var grade = require('./quiz2_grade')


module.exports = {

    gradeAnswer: function(data, answer, versions, score_settings) {
        var grader_data = safeEval(data)
        return grade(grader_data, answer, versions, score_settings)
    }

}