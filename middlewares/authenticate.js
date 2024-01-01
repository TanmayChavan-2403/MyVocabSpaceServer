const jwt = require('jsonwebtoken');
const { connection } = require('mongoose');

function authenticate(req, res, next){
	console.log("Authenticating...")
	const token = req.cookies.ningen;
	if (token){
		jwt.verify(token, process.env.JWT, (err, decodedToken) =>{
			if (err){
				console.log('[middlewares/authenticate.js line 9] Failed to validate cookie!')
				res.status(401).end();
			} else {
				req.body['id'] = decodedToken.id;
				console.log('[middlewares/authenticate.js line 12] Cookie token validated successfully!')
				next();
			}
		});
	} else {
		res.status(401).end();
	}
}

module.exports = authenticate;