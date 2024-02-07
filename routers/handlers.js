const Users = require('../models/credential');
const notificationSchema = require('../models/notification')
const dataSchema = require('../models/dataStructure')
const wCollecSchema = require('../models/wordCollection')
const mongoose = require('mongoose');
const fetch = require("node-fetch");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { json } = require('express');


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

const maxAge = 120
function createToken(id){
    return jwt.sign({id}, process.env.JWT, {
        expiresIn: 120
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
                            res.cookie('ningen', 'INVALID', {httpOnly: true, maxAge: 1 * 100, sameSite:"none",  secure: true})
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
                                notificationTurnedOn: response.notificationTurnedOn,
                                notificationFolder: response.notificationFolder,
                                subscriptionHealthStatus: response.subscriptionHealthStatus
                            }
                            res.cookie('ningen', token, {httpOnly: true, maxAge: maxAge, sameSite:"none", secure: true});
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
            if (error.message.includes("data and salt arguments required")){
                res.status(500).json({message: "data and salt arguments required"}).end()
            } else if (error.message.includes("Invalid salt")){
                res.status(500).json({message: "Invalid salt. Salt must be in the form of: $Vers$log2(NumRounds)$saltvalue"}).end()
            } else {
                res.status(400).json({message: error}).end()
            }
        } else {
            const token = createToken(userSchema._id);
            res.status(200).json({status: "PASS", access_token: userSchema._id, token});
            
            // Generating a collection with the username
            const sch = mongoose.model(generateCollectionName(userSchema), dataSchema)
        }
    }); 
}

module.exports.updateSubscriptionStatus = (req, res, next) =>{
    let {subscriptionURL, notif, id} =req.body;
    subscriptionURL = JSON.stringify(subscriptionURL);
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
                res.status(202).json({status: "FAIL", message: "Failed to update notification service"}).end();
            } else {
                // if the vaiables for the particular user was update successfully then now checking 
                // if user was subscribing or unsubscribing from the notification service, 
                if (notif){
                    // if user was subscribing then we will create a new document in 'Notificaiton' collection .
                    const notif = notificationSchema({
                        _id: id,
                        date_created: new Date().toJSON()
                    })
                    notif.save()
                    .then(doc => {
                        // if the new document was created successfully!
                        res.status(200).json({status: "Pass", message: "Subscribed Successfully! " }).end();
                    })
                    .catch(err => {
                        // If the new document creation process failed then we will also change the variabels
                        // in the 'credentials' collection to revert the database back to its original state.
                        Users.findOneAndUpdate({_id: id},{$set:{subscriptionURL: "",notificationTurnedOn: false}},() => {})
                        res.status(202).json({status: "FAIL", message: "Failed to initiate notification"}).end();
                    })
                } else {
                    // unsubscribing the notification feature and deleting the document from the 
                    // 'Notification' collection.
                    notificationSchema.deleteOne({_id: id},(err, result) => {
                        if (err){
                            // if failed to delete the document from 'Notification' collection
                            res.status(202).json({status: "FAIL", message: "Failed to unsubscribe notification service"}).end();
                        } else {
                            // if the document was deleted from 'Notification' collection
                            res.status(200).json({status: "Pass", message: "Unsubscribed Successfully! " }).end();
                        }
                    })
                }
            }
        }
    )
}

module.exports.logout = (req, res) =>{
    res.cookie('ningen', '', {maxAge: 1});
    res.json({status: "PASS", message: "Successfully logedout"}).end()
}


module.exports.updateNotificationFolder = async(req, res) => {
    const { categoryName, id } = req.body;

    if (mongoose.models[id]){
            delete mongoose.models[id];
        }
    // Creates a copy of schema
    let Schema = mongoose.model(id, dataSchema);

    // will get all the meanings having category as the category extracted on line 169;
    const result = await Schema.find({category: categoryName}).exec();

    // Populating payload to send it to serverCharlie
    const payload = {
        category: categoryName,
        id,
        data: result
    }
    fetch(`${process.env.DOMAINOFCHARLIE}/updateData`,{ 
        method: "POST",
        headers:{
            'Content-type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(resp => {
        console.log(resp.status);
        switch(resp.status){
            case 201:
                Users.findOneAndUpdate({_id: id}, 
                    {
                        $set: {
                            notificationFolder: categoryName
                        }
                    })
                .then(resp => {
                    console.log("Shoudl be updated successfully")
                    res.status(200).end();
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).end();
                })
                break;
            case 500:
                res.status(500).end();
                break;
        }
    })
    .catch(err => {
        console.log(err.message);
        res.status(202).json({Status: "FAIL", message: "Failed to start notification service"}).end();
    })
}























/* 
=========================================================================================================
<===================================== Handlers of data route ===========================================>
=========================================================================================================
*/

module.exports.TransferDataForInitiatingNotification = async (req, res) => {
    console.log("initiating the trasfer...");
    let {subscriptionURL, notif, id} =req.body;
    
    let response = await Users.findById(id, 'categories').exec();
    if (response){
        const category = response.categories[0];
        if (mongoose.models[id]){
            delete mongoose.models[id];
        }
    
        // Creates a copy of schema
        let Schema = mongoose.model(id, dataSchema);

        // will get all the meanings having category as the category extracted on line 169;
        const result = await Schema.find({category}).exec();

        // will set the category in users account and then only it will proceed furthuer;
        Users.findOneAndUpdate({_id: id}, {
            $set:{
                notificationFolder: category
            }
        }, (error, _) => {
            if(error){
                res.status(500).end();
            } else {
                payload = {
                    id,
                    subscriptionURL,
                    category,
                    data: result
                }
                fetch(`${process.env.DOMAINOFCHARLIE}/storeUserData`,{ 
                    method: "POST",
                    headers:{
                        'Content-type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                })
                .then(resp => {
                    switch(resp.status){
                        case 200:
                            res.status(200).end();
                        case 400:
                            console.log(resp.json());
                            res.status(400).end();
                    }
                })
                .catch(err => {
                    console.log(err.message);
                    res.status(202).json({Status: "FAIL", message: "Failed to start notification service"}).end();
                })
            }
        });

        
    }
}

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
    const {word, tagName, folderName, meaning, pin, complete, notify, id} = req.body;

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
    database.save( async (error) => {
            if (error){
                res.json({status: "FAIL", message: error}).end()
            } else {
                // Schema.collection.getIndexes({full: true}) [ RETURNS Promise so make sure handle it Atode. ]
                if (notify){
                    if (mongoose.models[id]){
                        delete mongoose.models[id];
                    }
                    // Adding the word in the first revision array 
                    const result = await notificationSchema.updateOne({_id: id}, {
                        $push:{firstRevision: {[word]: meaning}}
                    })
                    if (result.modifiedCount == 1){
                        res.json({status: "PASS", message: `Data added successfully!`}).end()
                    } else {
                        res.json({status: "PASS", message: `Data added successfully! But failed to add in notification`}).end()
                    }
                }
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

module.exports.updateNotificationList = (req, res) => {
    fetch(process.env.NOTIF_SERVER + "addSchedule", {
        method: "POST",
        headers: {
            'Content-type': "application/json"
        },
        body: JSON.stringify(req.body)
    })
    .then(resp => {
        console.log(resp.status)
        if (resp.status == 200){
            return resp.json()
        } else{
            res.status(resp.status).end()
        }
    }).then(data => {
        notificationSchema.findOneAndUpdate(
            {_id: req.body.id},
            {
                $push:{
                    "jobIds": data.jobId
                }
            }, (error, data) => {
                if(error){
                    res.status(509).end()
                } else {
                    res.status(200).end()
                }
            }
        )
    })
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