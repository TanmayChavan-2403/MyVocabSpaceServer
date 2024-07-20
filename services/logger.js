const fs = require('fs')
const LOGGER_PATH = process.cwd()

module.exports.log = (message, userid) => {
    fs.appendFile(LOGGER_PATH, `[${userid}] ${message} \n`);
}