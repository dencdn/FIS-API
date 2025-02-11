const express = require('express');

const admin_Head_Router = express.Router()

const setRole = require('../middleware/Role')

//import from adminHeadCOntroller
const {getForecastedValues,
       getPercentageForMonth,
       sendTestExpense,
       getRecords
      } = require('../controller/MultiAccess/AdminHeadController')

admin_Head_Router.use(setRole([1,2]))

//create endpoint
admin_Head_Router.get('/getForecastedValues', getForecastedValues)
admin_Head_Router.post('/getPercentageForMonth', getPercentageForMonth)
admin_Head_Router.post('/sendTestExpense', sendTestExpense)
admin_Head_Router.get('/getRecords', getRecords)

module.exports = admin_Head_Router;