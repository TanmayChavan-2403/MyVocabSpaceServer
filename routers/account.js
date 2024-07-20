const { Router } = require('express');
const helpers = require('../services/handlers');
const authenticate = require('../middlewares/authenticate');

const router = Router();

router.get('/firstVisit', authenticate, helpers.handleFirstVisit)
router.post('/login', helpers.handleLogin);
router.post('/register', helpers.handleRegestration)

// To start or stop notification service for that user.
router.post('/subscribe', authenticate, helpers.updateSubscriptionStatus)

router.post('/updateNotificationFolder', authenticate, helpers.updateNotificationFolder)

module.exports = router;