const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const array = {
    type: [Object],
    required: false
}

const notifCollection = mongoose.Schema({
    firstRevision: array,
    secondRevision: array,
    thirdRevision: array,
    fourthRevision: array,
    fifthRevision: array,
    jobIds: array,
    date_created: {
        type: String,
        required: false
    }
})


const notifModel = mongoose.model('notification', notifCollection);
module.exports = notifModel;