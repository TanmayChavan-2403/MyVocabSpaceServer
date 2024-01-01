const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const array = {
    type: [String],
    required: false
}

const notifCollection = mongoose.Schema({
    firstRevision: array,
    secondRevision: array,
    date_created: {
        type: String,
        required: false
    }
})


const notifModel = mongoose.model('notification', notifCollection);
module.exports = notifModel;