const { Router } = require('express');
const helpers = require('./handlers');
const authenticate = require('../middlewares/authenticate');

const router = Router();

router.get('/firstVisit', authenticate, helpers.handleLogin)
router.post('/login', helpers.handleLogin);
router.post('/register', helpers.handleRegestration)

module.exports = router;