const express = require('express');
const router = express.Router();
const { startDeployment } = require('../controllers/deploymentController.js');
const authenticateUser = require('../middlewares/authMiddleware.js');

router.post('/', authenticateUser, startDeployment);

module.exports = router;
