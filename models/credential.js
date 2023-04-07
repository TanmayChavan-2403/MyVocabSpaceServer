const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const account = mongoose.Schema({
    username:{
        type: String,
        required: true,
        trim: true
    },
    password:{
        type: String,
        required: true,
        trim: true
    },newNotificationReceived:{
        type: Boolean,
        required: false,
        default: false
    },defaultFolder:{
        type: String,
        required: false,
        default:'EMPTY'
    }, pinCount:{
        type: Number,
        required:false,
        default: 0
    }, email:{
        type: String,
        required: true,
    }, categories:{
        type: [String],
        required: false
    }, folders:{
        type: [String],
        required: false
    }, notificationTurnedOn:{
        type: Boolean,
        required: false,
        default: false
    }, subscriptionURL:{
        type: String,
        required: false,
        default: "NULL"
    }
})

// fire a function before doc id saved to database
account.pre('save', async function(next){
    this.password = await bcrypt.hash(this.password, process.env.SALT)
    next();
})

const credModel = mongoose.model('credential', account);
module.exports = credModel;