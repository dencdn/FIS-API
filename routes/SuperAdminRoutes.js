const express = require('express');
const SuperAdminRouter = express.Router();
const setRole = require('../middleware/Role');
const { getAllAccounts, 
        disableAccount, 
        createAccount, 
        deleteAcc, 
        retrieveRoles,
        changeAccess,
        deleteRequest } = require('../controller/SuperAdminController')

SuperAdminRouter.use(setRole([0]))

SuperAdminRouter.get('/getAllAccounts', getAllAccounts)
SuperAdminRouter.patch('/disableAcc/:id', disableAccount)
SuperAdminRouter.post('/create', createAccount)
SuperAdminRouter.delete('/deleteAcc/:id', deleteAcc)
SuperAdminRouter.get('/roles', retrieveRoles)
SuperAdminRouter.patch('/changePermission/:id', changeAccess)
SuperAdminRouter.delete('/deleteRequest/:id', deleteRequest)

module.exports = SuperAdminRouter;