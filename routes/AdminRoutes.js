const express = require('express');

const adminRouter = express.Router()

const setRole = require('../middleware/Role')

const {getAllLogs, 
       //readAdmin_records, 
       addFundCluster, 
       getFundCluster, 
       deleteFundCluster, 
       addRC, 
       getRC, 
       deleteRC, 
       addNameAndOffice, 
       getNameAndOffice, 
       deleteNameAndOffice,
       addTaxType,
       getTaxType,
       deleteTax,
       approveDV,
       getNumberOfRecords,
       downloadDV,
       downloadGSIS,
       returnRecordTo
        } = require('../controller/AdminController');

adminRouter.use(setRole([1]))
adminRouter.post('/downloadGSIS', downloadGSIS)
adminRouter.post('/downloadDV', downloadDV)
adminRouter.get('/getAllDV', getAllLogs)
//adminRouter.get('/approvedDV', readAdmin_records)
adminRouter.patch('/approveDocu/:id', approveDV)
//FUND CLUSTER
adminRouter.post('/addNewFundCluster', addFundCluster)
adminRouter.get('/getFundCluster', getFundCluster)
adminRouter.delete('/deleteFundCluster/:field_key', deleteFundCluster)
//RESPONSIBILITY CENTER
adminRouter.post('/addRC', addRC)
adminRouter.get('/getRC', getRC)
adminRouter.delete('/deleteRC/:field_key', deleteRC)
//NAME AND OFFICE
adminRouter.post('/addNameAndOffice', addNameAndOffice)
adminRouter.get('/getNameAndOffice', getNameAndOffice)
adminRouter.delete('/deleteNameAndOffice/:field_key', deleteNameAndOffice)
//TAX TYPE
adminRouter.post('/addTaxType', addTaxType)
adminRouter.get('/getTaxType', getTaxType)
adminRouter.delete('/deleteTax/:field_key', deleteTax)
adminRouter.post('/returnRecords', returnRecordTo)
//DASHBOARD (NUMBER OF RECORDS)


module.exports = adminRouter;