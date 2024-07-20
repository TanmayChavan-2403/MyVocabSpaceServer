const { Router } = require('express');
const helpers = require('../services/handlers');
const authenticate = require('../middlewares/authenticate');

const router = Router();

router.post('/getFolder', helpers.getFolder)
router.post('/find', authenticate, helpers.find);
router.post('/addData', authenticate, helpers.add);
router.get('/logout', authenticate, helpers.logout)
router.post('/updateField', authenticate, helpers.update);
router.delete('/deleteData', authenticate, helpers.delete);
router.get('/getList', authenticate ,helpers.getList, helpers.getFolder);
router.post('/udpateSuppDetails', authenticate, helpers.updateSuppDetails);

// used to add notification to cron-job.org website
router.post('/addNotificationSlot', authenticate, helpers.updateNotificationList)

// used to get the list of notification schedules of the user
router.get('/fetchNotificationList', authenticate, helpers.fetchNotificationList)

// Used to delete the cron-job
router.delete('/deleteJob', authenticate, helpers.deleteCronJob)

module.exports = router;