const mongoose = require('mongoose');

let stringStruct = {
        type: String,
        required: true,
        trim: true
    }
let boolStruct = {
    type: Boolean,
    required: true,
    trim: true
}
const dataSchema = mongoose.Schema({
    word : stringStruct,
    meaning: stringStruct,
    isPinned: boolStruct,
    isCompleted: boolStruct,
    tag: stringStruct,
    category: stringStruct,
    folderName: stringStruct
})

dataSchema.index({word: 1});

module.exports = dataSchema;