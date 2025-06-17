const express = require('express');
const admin = require("firebase-admin");
const { verifyGoogleToken } = require('../controllers/authController.js');

const router = express.Router();

router.post('/', verifyGoogleToken);


module.exports = router;