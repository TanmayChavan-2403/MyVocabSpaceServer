const Users = require('../models/credential');
const dataSchema = require('../models/dataStructure')
const wCollecSchema = require('../models/wordCollection')
const mongoose = require('mongoose');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


/* 
=========================================================================================================
<============================ MAKE USE OF MINI-MAP & HUGE SPACE FEATURE ==================================>
=========================================================================================================
*/













/* 
=========================================================================================================
<===================================== Handlers of account route ===========================================>
=========================================================================================================
*/

const maxAge = 10 * 60
function createToken(id){
    return jwt.sign({id}, process.env.JWT, {
        expiresIn: maxAge
    })
}

function generateCollectionName(userSchema){
    let id = JSON.stringify(userSchema._id);
    let result =  id.slice(1, id.length-1).trim()
    return result;
}

module.exports.handleLogin = async (req, res) =>{
    const {username, password} = req.body;
    Users.findOne(
        {username: username},
        (error, response) =>{
            if (error){
                res.json({status: "FAIL", message: `Internal server error`, debug: error}).end();
            } else{
                if (response){
                    bcrypt.compare(password, response.password, (err, result) =>{
                        console.log('[handlers.js line 58] Result after comparing password', result);
                        if (!result){
                            res.cookie('ningen', 'INVALID', {httpOnly: true, maxAge: 1 * 1000})
                            res.json({status: "FAIL", message: 'Wrong password, please retry with correct password'}).end();
                        } else {
                            const token = createToken(response._id);
                            //  MAIN response object is altered here.
                            let payload = {
                                defaultFolder: response.defaultFolder,
                                newNotificationReceived: response.newNotificationReceived,
                                pinCount: response.pinCount,
                                username: response.username,
                                email: response.email,
                                folders: response.folders,
                                categories: response.categories,
                                notificationTurnedOn: response.notificationTurnedOn
                            }
                            res.cookie('ningen', token, {httpOnly: true, maxAge: maxAge * 1000});
                            res.json({status: "PASS", message: 'Logged in successfully!', payload}).end();
                        }
                    })
                } else {
                    res.json({status: "FAIL", message: `Account with ${username} doesn't exists`}).end();
                }
            }
        }
    )
}

module.exports.handleRegestration = (req, res) => {
    const {username, password, email} = req.body;
    const userSchema = Users();

    userSchema.username = username;
    userSchema.password = password;
    userSchema.email = email;

    userSchema.save( async function (error){
        if (error){
            res.json({status: "FAIL", response: error}).end()
        } else {
            const token = createToken(userSchema._id);
            res.json({status: "PASS", access_token: userSchema._id, token});
            
            // Generating a collection with the username
            const sch = mongoose.model(generateCollectionName(userSchema), dataSchema)
        }
    }); 
}

module.exports.subcribe = (req, res) =>{
    let {subscriptionURL, notif, id} =req.body;
    subscriptionURL = JSON.stringify(subscriptionURL);
    console.log(notif);
    Users.findOneAndUpdate(
        {_id: id},
        {
            $set:{
                subscriptionURL: subscriptionURL,
                notificationTurnedOn: notif
            }
        },
        (error, resp) => {
            if(error){
                console.log(error)
                res.status(202).json({Status: "FAIL", message: "Failed to initiate notification"}).end();
            } else {
                res.status(200).json({Status: "PASS", message: "Notification initiated successfully!"}).end();
            }
        }
    )
}

module.exports.logout = (req, res) =>{
    res.cookie('ningen', '', {maxAge: 1});
    res.json({status: "PASS", message: "Successfully logedout"}).end()
}
























/* 
=========================================================================================================
<===================================== Handlers of data route ===========================================>
=========================================================================================================
*/

module.exports.getList = async (req, res, next) =>{
    let {page, limit, defaultFolder} = req.query;
    
    if (page == 0){
        condition = {isPinned: true, folderName: defaultFolder};
        limit = 0;
    } else {
        condition = {isPinned: false, folderName: defaultFolder}
    }

    if (page != 0){
        page = parseInt(page) - 1;
    }
    let skip = page * limit;

    req.body = {
        id: req.body.id,
        condition,
        skip,
        limit: parseInt(limit),
        defaultFolder
    }
    next();
}

module.exports.add = async(req, res) => {
    const {word, tagName, folderName, meaning, pin, complete, id} = req.body;
    // User defined function to get model for the perticular user
    if (mongoose.models[id]){
        delete mongoose.models[id];
    }

    // Creates a copy of schema
    let Schema = mongoose.model(id, dataSchema);
    let database = Schema({
        word : word,
        meaning: meaning,
        isPinned: pin,
        isCompleted: complete,
        tag: generateTagName(tagName),
        category: tagName,
        folderName: folderName
    });
    database.save((error) => {
            if (error){
                res.json({status: "FAIL", message: error}).end()
            } else {
                // Schema.collection.getIndexes({full: true}) [ RETURNS Promise so make sure handle it Atode. ]
                res.json({status: "PASS", message: `Data added successfully!`}).end()
            }
        }
    )
}

module.exports.delete = async (req, res, next) =>{
    const {key, word, id} = req.body;
   // User defined function to get model for the perticular user
    if (mongoose.models[id]){
        delete mongoose.models[id];
    }

    // Creates a copy of schema
    let Schema = mongoose.model(id, dataSchema);

    let response = await Schema.findOneAndDelete({_id: key}).exec();
    if (response){
        res.json({status: "PASS", message: `${word} deleted successfully`}).end();
    } else {
        res.json({status: "PASS", message: `Couldn't find ${word} in your record`}).end();
    }
}

module.exports.update = async (req, res, next) =>{
    const {key, changes, id} = req.body;

    // User defined function to get model for the perticular user
    if (mongoose.models[id]){
        delete mongoose.models[id];
    }
    console.log(req.body);
    // Creates a copy of schema
    let Schema = mongoose.model(id, dataSchema);

    Schema.findOneAndUpdate(
        {_id: key},
        {
            $set: changes
        },
        (error, data) => {
            if (error){
                res.json({status: "FAIL", message: 'Failed to update status, please try again later'}).end()
            } else {
                res.json({status: "PASS", message: 'Updated successfully'}).end()
            }
        }

    )

    console.log("Executing something...");
}

module.exports.find = async (req, res, next) =>{
    const {word, id} = req.body;

    // User defined function to get model for the perticular user
    if (mongoose.models[id]){
        delete mongoose.models[id];
    }

    // Creates a copy of schema
    let Schema = mongoose.model(id, dataSchema);
    let options = 'i';
    let regexString = new RegExp("^" + word);
    const result = await Schema.find({word: {$regex: regexString, $options: options}}).exec();
    res.json({data: result}).end();
}

module.exports.getFolder = async (req, res, next) =>{
    const {id, condition, skip, limit, defaultFolder} = req.body;
    // User defined function to get model for the perticular user
    if (mongoose.models[id]){
        delete mongoose.models[id];
    }

    // Creates a copy of schema
    let Schema = mongoose.model(id, dataSchema);
    console.log(req.body);
    let result1 = await Schema.find(condition).skip(skip).limit(limit).sort({word: 1}).exec();
    // console.log(req.body);
    // return;
    // This means either we don't have any data or we just don't have any pinned data which we fetch for first round/page;
    if (result1.length > 0){
        res.status(200).json({status: 'PASS', response: result1, resultCount: result1.length}).end();
    }
    // It might be first fetch/page/round where we try to get all pinned data, but we don't have any pinned data
    //  and so now lets skip pinned data and try to get unpinned data in first fetch.
     else {
        let result2 = await Schema.find({isPinned: false, folderName: defaultFolder}).skip(skip).limit(limit - result1.length).sort({word: 1}).exec();
        if (result2.length == 0){
            res.status(200).json({status: 'FAIL', response: [] , resultCount: 0}).end();
        } else {
            res.status(200).json({status: 'PASS', response: result2 , resultCount: result2.length}).end();
        }
    }
}

module.exports.updateSuppDetails = (req, res) => {
    const {field, newValue ,id} = req.body;
    console.log(req.body);
    Users.findOneAndUpdate(
        {_id: id},
        {
            $push:{
                [field]: newValue
            }
        }, (error, data) => {
            if(error){
                res.json({status: 'FAIL', message: "Failed to add into respective folders"}).end();
            } else {
                res.json({status: 'PASS', message: "Successfully added into respective folders"}).end();
            }
        }
    )
}


function generateTagName(folderName, length=5){
    if (folderName != "mix"){
        tag = folderName.slice(0, length);
        return tag;
    };
    return folderName;
}




























/* 
=========================================================================================================
<===================================== Handlers of data {} ===========================================>
=========================================================================================================
*/