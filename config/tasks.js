var fs = require('fs')
module.exports = {

    grader_key: fs.readFileSync(process.env.TASKS_GRADER_KEY_FILE).toString()

}