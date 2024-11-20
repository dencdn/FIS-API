const express = require('express');

const router = express.Router()

const requireAuth = require('../middleware/requireAuth')
const refreshAuth = require('../middleware/refreshAuth')
const {login, refreshToken} = require('../controller/UserController');

router.get('/login',requireAuth, login)
router.get('/refreshToken', refreshAuth, refreshToken)

module.exports = router