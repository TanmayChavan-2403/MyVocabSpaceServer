const { Router } = require('express');
const helpers = require('./handlers');
const authenticate = require('../middlewares/authenticate');

const router = Router();

router.post('/addData', authenticate, helpers.add);
router.post('/find', authenticate, helpers.find);
router.post('/getFolder', helpers.getFolder)
router.post('/updateField', authenticate, helpers.update);
router.post('/udpateSuppDetails', authenticate, helpers.updateSuppDetails);
router.delete('/deleteData', authenticate, helpers.delete);
router.get('/logout', authenticate, helpers.logout)
router.get('/getList', authenticate ,helpers.getList, helpers.getFolder);


module.exports = router;