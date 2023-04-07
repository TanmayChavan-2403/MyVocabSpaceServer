const mongoose = require('mongoose');

let schema = mongoose.Schema({
	startsWith: {
		type: String,
		required: false
	}, 
	wCollection: {
		type: [Object],
		required: false
	}
})

module.exports = schema;