var safeEval = require('safe-eval')

function testMultiple(valid, answers) {
    var mistakes = [];
    for(var i=0; i<answers.length; i++) {
        if(valid.indexOf(answers[i]) === -1) {
            mistakes.push(answers[i]);
        }
    }
    return mistakes.length == 0 && valid.length == answers.length ? true : mistakes;
}


function testStrict(valid, answers) {
    var mistakes = [];
    for(var i=0; i<answers.length; i++) {
        if(valid[i] !== answers[i]) {
            mistakes.push(answers[i]);
        }
    }
    return mistakes.length == 0 && valid.length == answers.length ? true : mistakes;
}

function grade(grader_data, answer, versions) {
    var res = {
        score: 0,
        mistakes: [],
        messages: []
    }
    try {
        var valid;
        for (var i = 0; i < grader_data.length; i++) {
            var grader = grader_data[i];
            if(versions && i in versions) {
                grader = grader[versions[i]];
            }
            if (typeof grader === "function") {
                var fres = grader(answer[i]);
                if (typeof fres === "object") {
                    var score =
                        "score" in fres ? parseFloat(fres.score) || 0 : 0;
                    valid = score > 0;
                    if ("message" in fres && fres.message) {
                        res.messages[i] = fres.message;
                    }
                    res.score += score;
                } else {
                    valid = !!fres;
                    res.score += valid ? 1 : 0;
                }
                res.mistakes.push(valid ? null : answer[i]);
            } else if (Array.isArray(grader)) {
                var test = testMultiple(grader, answer[i]);
                valid = test === true;
                res.mistakes.push(valid ? [] : test);
                res.score += valid ? 1 : 0;
            } else if (typeof grader == 'object') {
                if(Array.isArray(grader.value)) {
                    if(grader.strict) {
                        var test = testStrict(grader.value, answer[i]);
                    } else {
                        var test = testMultiple(grader.value, answer[i]);
                    }
                    valid = test === true;
                    var mistakes = valid ? [] : test;
                    res.mistakes.push(mistakes);
                    if(grader.messages && mistakes.length) {
                        res.messages[i] = [];
                        for(var j=0; j<mistakes.length; j++) {
                            if(grader.messages[mistakes[j]]) {
                                res.messages[i][mistakes[j]] = grader.messages[mistakes[j]];
                            }
                        }
                    }
                } else {
                    valid = grader == answer[i] ? 1 : 0;
                    res.mistakes.push(valid ? null : answer[i]);
                    if(grader.messages && !valid && grader.messages[answer[i]]) {
                        res.messages[i] = grader.messages[answer[i]];
                    }
                }
                res.score += valid ? 1 : 0;
            } else {
                valid = grader == answer[i] ? 1 : 0;
                res.mistakes.push(valid ? null : answer[i]);
                res.score += valid ? 1 : 0;
            }
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