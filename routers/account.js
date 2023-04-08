const { Router } = require('express');
const helpers = require('./handlers');
const authenticate = require('../middlewares/authenticate');

const router = Router();

router.get('/firstVisit', authenticate, helpers.handleLogin)
router.post('/login', helpers.handleLogin);
router.post('/register', helpers.handleRegestration)
router.post('/subscribe', authenticate, helpers.subcribe, helpers.TransferDataForInitiatingNotification)
router.post('/updateNotificationFolder', authenticate, helpers.updateNotificationFolder)

module.exports = router;