const express = require('express');

const OperatorRouter = express.Router();

const setRole = require('../middleware/Role');

const {
    opReturnDocu, 
    transferDocument,
    getPermission,
    appendDataToSheet,
    addControlBook,
    addNewFieldOffice,
    updateControlBook,
    deleteControlBook,
    updateFieldOffice,
    deleteFieldOffice,
    updateASA_ORS,
    getBUR
} = require('../controller/OperatorController');

OperatorRouter.use(setRole([3]))

OperatorRouter.post('/return_record', opReturnDocu)
OperatorRouter.post('/transferDocu', transferDocument)
OperatorRouter.get('/getPermission', getPermission)
OperatorRouter.post('/appendDataToSheet', appendDataToSheet)
OperatorRouter.post('/addControlBook', addControlBook)
OperatorRouter.post('/addFieldOffice/:id', addNewFieldOffice)
OperatorRouter.patch('/updateControlBook/:id', updateControlBook)
OperatorRouter.delete('/deleteControlBook/:id', deleteControlBook)
OperatorRouter.patch('/updateFieldOffice/:id', updateFieldOffice)
OperatorRouter.delete('/deleteFieldOffice/:id', deleteFieldOffice)
OperatorRouter.patch('/updateASA_ORS/:id', updateASA_ORS)
OperatorRouter.get('/getBUR', getBUR)

module.exports = OperatorRouter