const express = require('express');
const HeadRouter = express.Router();
const setRole = require('../middleware/Role');
const { //readHead_records, 
        returnRecordTo, 
        transferDocument, 
        getPermission } = require('../controller/HeadController')

HeadRouter.use(setRole([2]))

//HeadRouter.get('/read_records', readHead_records)
HeadRouter.post('/return_record', returnRecordTo)
HeadRouter.post('/passToAdmin', transferDocument)
HeadRouter.get('/getPermission', getPermission)

module.exports = HeadRouter;