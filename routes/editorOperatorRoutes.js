const express = require('express');

const EditorOperatorRouter = express.Router()

const setRole = require('../middleware/Role')

//import from adminHeadCOntroller
const {getNumberOfCopies,
      } = require('../controller/MultiAccess/EditorOperator')

EditorOperatorRouter.use(setRole([3,4]))

//create endpoint
EditorOperatorRouter.get('/getNumberOfCopies', getNumberOfCopies)


module.exports = EditorOperatorRouter;