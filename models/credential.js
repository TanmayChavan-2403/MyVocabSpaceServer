const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const struct1 = {
        type: String,
        required: true,
        trim: true
    }

const struct2 = {
        type: [String],
        required: false
    }
const struct3 ={
        type: String,
        required: false,
        default:'EMPTY'
    }

const account = mongoose.Schema({
    username: struct1,
    password:struct1
    ,newNotificationReceived: {
        type: Boolean,
        required: false,
        default: false
    }
    ,defaultFolder:struct3,
    pinCount:{
        type: Number,
        required:false,
        default: 0
    }, email:{
        type: String,
        required: true,
    },
    categories:struct2,
    folders:struct2
    , notificationTurnedOn:{
        type: Boolean,
        required: false,
        default: false
    }, subscriptionURL:{
        type: String,
        required: false,
        default: "NULL"
    }, notificationFolder: struct3,
    subscriptionHealthStatus: false
})

// fire a function before doc id saved to database
account.pre('save', async function(next){
    this.password = await bcrypt.hash(this.password, process.env.SALT)
    next();
})

const credModel = mongoose.model('credential', account);
module.exports = credModel;