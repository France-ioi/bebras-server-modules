var safeEval = require('safe-eval')

function testMultiple(valid, answer) {
    var s1 = valid.sort(), s2 = answer.sort(), mistakes = [];
    var res = s1.every(function(v, i) {
        if(v == s2[i]) {
            return true;
        }
        mistakes.push(s2[i]);
        return false;
    });
    return res === true ? res : mistakes;
}

function grade(grader_data, answer) {
    var res = {
        score: 0,
        mistakes: [],
        messages: []
    }
    try {
        var valid;
        for(var i=0; i<grader_data.length; i++) {
            if(typeof grader_data[i] === 'function') {
                var fres = grader_data[i](answer[i]);
                if(typeof fres === 'object') {
                    valid = 'valid' in fres && fres.valid;
                    if('message' in fres && fres.message) {
                        res.messages.push(fres.message);
                    }
                } else {
                    valid = !!fres;
                }
                res.mistakes.push(valid ? null : answer[i]);
            } else if(Array.isArray(grader_data[i])) {
                var test = testMultiple(grader_data[i], answer[i]);
                valid = test === true;
                res.mistakes.push(valid ? [] : test);
            } else {
                valid = grader_data[i] == answer[i] ? 1 : 0;
                res.mistakes.push(valid ? null : answer[i]);
            }
            res.score += valid ? 1 : 0;
        }
        res.score = res.score / grader_data.length;
    } catch(e) {
        res = {
            score: 0,
            mistakes: [],
            messages: []
        }
    }
    return res;
}


module.exports = {

    gradeAnswer: function(data, answer) {
        var grader_data = safeEval(data) // TODO: may be safeEval in repo?
        return grade(grader_data, answer)
    }

}